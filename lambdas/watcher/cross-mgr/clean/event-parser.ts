import { mapValues } from 'lodash-es'
import { startCase } from 'lodash-es'
import type {
  CrossMgrEventBundle,
  CrossMgrEventRawData,
  CrossMgrEventResultPayload
} from '../types.ts'
import type {
  CleanAthleteRaceResult,
  CleanEventAthlete,
  CleanEventWithResults
} from '../../../shared/types.ts'
import type { EventCategory, EventSummary } from '../../../../src/types/results.ts'
import {
  formatRaceNotes, getEventDiscipline,
  transformCategory, transformLocation,
  transformOrganizer,
  transformSerieAlias
} from '../utils.ts'
import {
  capitalize,
  createUmbrellaCategories,
  getCombinedRaceCategories,
  formatCategoryAlias,
  formatProvince,
} from '../../../shared/utils.ts'
import { PROVIDER_NAME, SOURCE_URL_PREFIX } from '../config.ts'
import defaultLogger from '../../../shared/logger.ts'
import {
  calculateBCUpgradePoints,
  calculateFieldSize,
  getSanctionedEventType,
  hasDoubleUpgradePoints,
  hasUpgradePoints
} from '../../../shared/upgrade-points.ts'
import { TeamParser } from '../../../shared/team-parser.ts'
import type { AthleteOverrides } from '../../athletes/types.ts'

const logger = defaultLogger.child({ provider: PROVIDER_NAME })

export const parseEvent = (
  eventBundle: CrossMgrEventBundle,
  payloads: CrossMgrEventRawData['payloads'],
  athletesOverrides: AthleteOverrides
): CleanEventWithResults => {
  const firstPayload = Object.values(payloads)[0]
  const eventName = startCase(firstPayload.raceNameText.split('-')[0])
  const organizerObj = transformOrganizer(eventBundle.organizer, firstPayload.organizer)
  const serie = transformSerieAlias(eventBundle.serie, eventBundle.organizer) || null

  logger.info(`Parsing raw data for ${eventBundle.type} ${eventBundle.hash}: ${eventName}`)

  const sanctionedEventType = getSanctionedEventType({
    organizerAlias: organizerObj.organizerAlias,
    serie,
    name: eventName,
    year: eventBundle.year,
  })

  const eventSummary: Omit<EventSummary, 'categories'> = {
    hash: eventBundle.hash,
    date: eventBundle.date!,
    year: eventBundle.year,
    type: 'event',
    discipline: getEventDiscipline(eventBundle, eventName),
    location: transformLocation(firstPayload.raceAddress),
    ...organizerObj,
    organizerEmail: firstPayload.email,
    name: eventName,
    // flags: firstPayload.flags,
    isTimeTrial: firstPayload.isTimeTrial,
    serie,
    sanctionedEventType,
    hasUpgradePoints: hasUpgradePoints(sanctionedEventType),
    isDoubleUpgradePoints: hasDoubleUpgradePoints(sanctionedEventType),
    provider: PROVIDER_NAME,
  }

  const allEventAthleteData = Object.values(payloads).reduce((acc, payload) => {
    if (!payload.data) return acc

    Object.keys(payload.data).forEach((bibNumber) => {
      acc![bibNumber] = payload.data![bibNumber]
    })

    return acc
  }, {} as CrossMgrEventResultPayload['data'])

  const allEventPrimes = Object.values(payloads).reduce((acc, payload) => {
    if (payload.primes) {
      payload.primes.forEach((prime) => {
        acc.push(prime)
      })
    }

    return acc
  }, [] as CrossMgrEventResultPayload['primes'])

  let allEventCategories = Object.values(payloads).reduce((acc, payload) => {
    if (!payload.catDetails) return acc

    payload.catDetails.forEach((cat) => {
      const categoryName = transformCategory(cat.name, eventSummary)
      const categoryGender = cat.gender === 'Men' ? 'M' : cat.gender === 'Women' ? 'F' : 'X'
      const alias = formatCategoryAlias(categoryName)

      if (cat.name !== 'All') {
        const athleteRaceResults: CleanAthleteRaceResult[] = cat.pos.map((bibNumber, index) => {
          const athleteData = allEventAthleteData?.[bibNumber]

          if (!athleteData) {
            logger.warn('Error: cannot find athlete data for bib #' + bibNumber + ` (category: ${cat.name})`, {
              hash: eventBundle.hash,
              athleteData
            })
            return
          }

          let position = -1
          let finishGap = 0

          if (athleteData.status === 'Finisher') {
            position = index + 1
            finishGap = cat.gapValue[index]
          }

          const lapDurations = athleteData.raceTimes.reduce((acc, lapFinishTime, i) => {
            if (i > 0) {
              const previousLapFinishTime = athleteData.raceTimes[i - 1]

              acc.push(lapFinishTime - previousLapFinishTime)
            }

            return acc
          }, [] as number[])

          return {
            position,
            athleteId: bibNumber.toString(),
            bibNumber,
            lapSpeeds: athleteData.lapSpeeds,
            lapDurations,
            lapTimes: athleteData.raceTimes,
            avgSpeed: +(athleteData.speed.replace('km/h', '').trim()),
            status: athleteData.status.toUpperCase() as 'FINISHER' | 'DNF' | 'DNS' | 'OTL',
            relegated: athleteData.relegated,
            finishTime: athleteData.lastTime - (athleteData.raceTimes?.[0] || 0),
            finishGap,
          }
        }).filter(result => result !== undefined)

        const primes = allEventPrimes.filter(prime => cat.pos.includes(prime.winnerBib)).map((prime, index) => {
          return {
            number: index + 1,
            position: prime.position,
            athleteId: prime.winnerBib.toString(),
          }
        })

        acc[alias] = {
          alias,
          label: categoryName,
          gender: categoryGender,
          startTime: payload.raceStartTime + cat.startOffset,
          laps: cat.laps,

          starters: cat.starters,
          finishers: cat.finishers,
          distanceUnit: cat.distanceUnit,
          lapDistance: cat.lapDistance,
          raceDistance: cat.raceDistance,

          results: athleteRaceResults,
          primes,
        } as EventCategory
      }
    })

    return acc
  }, {} as Record<string, EventCategory>)

  let allEventAthletes = Object.values(payloads).reduce((acc, payload) => {
    if (!payload.data) return acc

    Object.keys(payload.data).forEach((bibNumber) => {
      const resultRow = payload.data![bibNumber]
      const racerGender: 'M' | 'F' | 'X' = resultRow.Gender === 'Men' ? 'M' : resultRow.Gender === 'Women' ? 'F' : 'X'
      const formattedUCIId = resultRow.UCIID?.replace(/\s/g, '').trim()
      let team = TeamParser.parseTeamName(resultRow.Team)
      // If athlete has an override for the current year team, use that instead
      if (athletesOverrides.athleteData?.[formattedUCIId]?.[`team.${eventBundle.year}`]) {
        team = TeamParser.getTeamByName(athletesOverrides.athleteData[formattedUCIId]?.[`team.${eventBundle.year}`])
      }

      const athlete = {
        bibNumber: +bibNumber,
        firstName: capitalize(resultRow.FirstName),
        lastName: capitalize(resultRow.LastName),
        age: resultRow.Age ? +resultRow.Age : undefined,
        gender: racerGender,
        city: resultRow.City,
        province: formatProvince(resultRow.StateProv),
        license: resultRow.License,
        eventCategories: [formatCategoryAlias(resultRow.Category)],
        uciId: formattedUCIId,
        team: team?.name,
        nationality: resultRow.NatCode?.length ? resultRow.NatCode.toUpperCase() : undefined,
      }

      if (acc[bibNumber]) {
        acc[bibNumber].eventCategories.push(athlete.eventCategories[0])
      } else {
        acc[bibNumber] = athlete
      }
    })

    return acc
  }, {} as Record<string, CleanEventAthlete>)

  const allEventRaceNotes = Object.values(payloads).reduce((acc, payload) => {
    if (payload.raceNotes?.trim().length) acc = acc += formatRaceNotes(payload.raceNotes) + '<br />'
    return acc
  }, '')

  // Check if some categories are combined
  const combinedCategoryGroups = getCombinedRaceCategories(eventSummary)

  // Create umbrella categories for combined categories
  const {
    categories: updatedCategories,
    errors: umbrellaCategoriesErrors
  } = createUmbrellaCategories(allEventCategories, combinedCategoryGroups)

  allEventCategories = updatedCategories
  if (umbrellaCategoriesErrors?.length) {
    umbrellaCategoriesErrors.forEach(error => {
      logger.warn(error, {
        provider: PROVIDER_NAME,
        eventHash: eventBundle.hash,
        year: eventBundle.year,
      })
    })
  }

  // Clean athlete event categories (remove deleted categories & umbrella categories)
  allEventAthletes = mapValues(allEventAthletes, (athlete: CleanEventAthlete) => ({
    ...athlete,
    eventCategories: athlete.eventCategories.filter(catAlias => !!allEventCategories[catAlias] && !allEventCategories[catAlias].combinedCategories),
  }))

  if (eventSummary.hasUpgradePoints) {
    // Calculate upgrade points for each category
    allEventCategories = mapValues(allEventCategories, (category: EventCategory, categoryAlias: string) => {
      let categoryGroup
      let fieldSize

      if (category.combinedCategories) {
        categoryGroup = combinedCategoryGroups.find(group => group.umbrellaCategory === category.alias)

        // Dont calculate upgrade points for umbrella categories, unless specified
        if (categoryGroup?.categoriesForPoints !== 'UMBRELLA') return category

        const combinedCategories = [category]
        fieldSize = calculateFieldSize(combinedCategories)
      } else {
        categoryGroup = combinedCategoryGroups.find(group => group.categories.some(c => c === categoryAlias))

        // Dont calculate upgrade points for combined categories, unless specified
        if (categoryGroup?.categoriesForPoints === 'UMBRELLA') return category

        const combinedCategories = categoryGroup?.categories.map(alias => allEventCategories[alias]) || [category]
        fieldSize = calculateFieldSize(combinedCategories)
      }

      // Calculate upgrade points for the category/combined categories
      const upgradePoints = calculateBCUpgradePoints({
        category,
        fieldSize,
        eventType: sanctionedEventType,
      })

      return {
        ...category,
        fieldSize,
        upgradePoints,
      } as EventCategory
    })
  }

  return {
    ...eventSummary,
    athletes: allEventAthletes,
    results: allEventCategories,
    sourceUrls: Object.keys(payloads).map(filename => SOURCE_URL_PREFIX + filename),
    raceNotes: allEventRaceNotes,
    lastUpdated: eventBundle.lastUpdated,
  }
}