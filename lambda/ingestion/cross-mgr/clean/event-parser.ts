import _ from 'lodash'
import type {
  CrossMgrEventBundle,
  CrossMgrEventRawData,
  CrossMgrEventResultPayload
} from '../types.ts'
import type {
  CleanAthleteRaceResult,
  CleanEventAthlete,
  CleanEventWithResults
} from '../../shared/types.ts'
import type { EventCategory, EventSummary } from '../../../../src/types/results.ts'
import {
  formatRaceNotes, getCombinedRaceCategories, getEventDiscipline,
  transformCategory, transformLocation,
  transformOrganizer,
  transformSerieAlias
} from '../utils.ts'
import {
  capitalize,
  createUmbrellaCategories,
  formatCategoryAlias,
  formatProvince,
} from '../../shared/utils.ts'
import { PROVIDER_NAME, SOURCE_URL_PREFIX } from '../config.ts'
import defaultLogger from '../../shared/logger.ts'
import {
  calculateBCUpgradePoints,
  calculateFieldSize,
  getSanctionedEventType,
  hasDoubleUpgradePoints,
  hasUpgradePoints
} from '../../shared/upgrade-points.ts'
import { TeamParser } from '../../shared/team-parser.ts'

const logger = defaultLogger.child({ provider: PROVIDER_NAME })

export const parseEvent = (
  eventBundle: CrossMgrEventBundle,
  payloads: CrossMgrEventRawData['payloads'],
): CleanEventWithResults => {
  const firstPayload = Object.values(payloads)[0]
  const eventName = _.startCase(firstPayload.raceNameText.split('-')[0])
  const organizerObj = transformOrganizer(eventBundle.organizer, firstPayload.organizer)
  const serie = transformSerieAlias(eventBundle.serie, eventBundle.organizer) || null

  logger.info(`Parsing raw data for ${eventBundle.type} ${eventBundle.hash}: ${eventName}`)

  const sanctionedEventType = getSanctionedEventType({
    organizerAlias: organizerObj.organizerAlias,
    serie,
    name: eventName
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

  const allEventAthletes = Object.values(payloads).reduce((acc, payload) => {
    if (!payload.data) return acc

    Object.keys(payload.data).forEach((bibNumber) => {
      const resultRow = payload.data![bibNumber]
      const racerGender: 'M' | 'F' | 'X' = resultRow.Gender === 'Men' ? 'M' : resultRow.Gender === 'Women' ? 'F' : 'X'
      const team = TeamParser.parseTeamName(resultRow.Team)

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
        uciId: resultRow.UCIID?.replace(/\s/g, '').trim(),
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
  const combinedCategoryGroups = getCombinedRaceCategories(eventBundle)

  // Create umbrella categories for combined categories
  allEventCategories = createUmbrellaCategories(allEventCategories, combinedCategoryGroups)

  if (eventSummary.hasUpgradePoints) {
    // Calculate upgrade points for each category
    allEventCategories = _.mapValues(allEventCategories, (category: EventCategory, categoryAlias: string) => {
      // Dont calculate upgrade points for umbrella categories
      if (category.combinedCategories) return category

      const categoryGroup = combinedCategoryGroups.find(group => group.categories.some(c => c === categoryAlias))
      const combinedCategories = categoryGroup?.categories.map(alias => allEventCategories[alias]) || [category]
      const fieldSize = calculateFieldSize(combinedCategories)

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