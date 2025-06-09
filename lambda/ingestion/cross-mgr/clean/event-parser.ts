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
  formatRaceNotes,
  transformCategory,
  transformOrganizer,
  transformSerieAlias
} from '../utils.ts'
import { capitalize, formatCategoryAlias, formatProvince, formatTeamName } from '../../shared/utils.ts'
import { PROVIDER_NAME, SOURCE_URL_PREFIX } from '../config.ts'
import defaultLogger from '../../shared/logger.ts'
import {
  calculateBCUpgradePoints,
  calculateFieldSize, getCombinedRaceCategories,
  getSanctionedEventType,
  hasDoubleUpgradePoints,
  hasUpgradePoints
} from '../../shared/upgrade-points.ts'

const logger = defaultLogger.child({ provider: PROVIDER_NAME })

export const parseEvent = (eventBundle: CrossMgrEventBundle, payloads: CrossMgrEventRawData['payloads']): CleanEventWithResults => {
  const firstPayload = Object.values(payloads)[0]
  const eventName = _.startCase(firstPayload.raceNameText.split('-')[0])
  const organizerObj = transformOrganizer(eventBundle.organizer, firstPayload.organizer)

  logger.info(`Parsing raw data for ${eventBundle.type} ${eventBundle.hash}: ${eventName}`)

  const sanctionedEventType = getSanctionedEventType({
    organizerAlias: organizerObj.organizerAlias,
    serie: eventBundle.serie,
    name: eventName
  })

  const eventSummary: Omit<EventSummary, 'categories'> = {
    hash: eventBundle.hash,
    date: eventBundle.date!,
    year: eventBundle.year,
    type: 'event',
    ...organizerObj,
    organizerEmail: firstPayload.email,
    name: eventName,
    // flags: firstPayload.flags,
    isTimeTrial: firstPayload.isTimeTrial,
    serie: transformSerieAlias(eventBundle.serie, eventBundle.organizer) || null,
    sanctionedEventType,
    hasUpgradePoints: hasUpgradePoints(sanctionedEventType),
    isDoubleUpgradePoints: hasDoubleUpgradePoints(sanctionedEventType),
    provider: PROVIDER_NAME,
  }

  const combinedAthleteData = Object.values(payloads).reduce((acc, payload) => {
    if (!payload.data) return acc

    Object.keys(payload.data).forEach((bibNumber) => {
      acc![bibNumber] = payload.data![bibNumber]
    })

    return acc
  }, {} as CrossMgrEventResultPayload['data'])

  const combinedPrimes = Object.values(payloads).reduce((acc, payload) => {
    if (payload.primes) {
      payload.primes.forEach((prime) => {
        acc.push(prime)
      })
    }

    return acc
  }, [] as CrossMgrEventResultPayload['primes'])

  let combinedEventCategories = Object.values(payloads).reduce((acc, payload) => {
    if (!payload.catDetails) return acc

    payload.catDetails.forEach((cat) => {
      const categoryName = transformCategory(cat.name, eventSummary)
      const categoryGender = cat.gender === 'Men' ? 'M' : cat.gender === 'Women' ? 'F' : 'X'
      const alias = formatCategoryAlias(categoryName)

      if (cat.name !== 'All') {
        const athleteRaceResults: CleanAthleteRaceResult[] = cat.pos.map((bibNumber, index) => {
          const athleteData = combinedAthleteData?.[bibNumber]

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

        const primes = combinedPrimes.filter(prime => cat.pos.includes(prime.winnerBib)).map((prime, index) => {
          return {
            number: index + 1,
            position: prime.position,
            bibNumber: prime.winnerBib,
          }
        })

        acc[alias] = {
          alias,
          label: categoryName,
          startOffset: cat.startOffset,
          gender: categoryGender,
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

  const combinedAthletes = Object.values(payloads).reduce((acc, payload) => {
    if (!payload.data) return acc

    Object.keys(payload.data).forEach((bibNumber) => {
      const resultRow = payload.data![bibNumber]
      const racerGender = resultRow.Gender === 'Men' ? 'M' : resultRow.Gender === 'Women' ? 'F' : 'X'

      acc[bibNumber] = {
        bibNumber: +bibNumber,
        firstName: capitalize(resultRow.FirstName),
        lastName: capitalize(resultRow.LastName),
        age: resultRow.Age ? +resultRow.Age : undefined,
        gender: racerGender,
        city: resultRow.City || null,
        province: formatProvince(resultRow.StateProv) || null,
        license: resultRow.License,
        uciId: resultRow.UCIID?.replace(/\s/g, '').trim() || null,
        team: formatTeamName(resultRow.Team),
      }
    })

    return acc
  }, {} as Record<string, CleanEventAthlete>)

  const combinedRaceNotes = Object.values(payloads).reduce((acc, payload) => {
    if (payload.raceNotes?.trim().length) acc = acc += formatRaceNotes(payload.raceNotes) + '<br />'
    return acc
  }, '')

  if (eventSummary.hasUpgradePoints) {
    // Calculate upgrade points for each category
    combinedEventCategories = _.mapValues(combinedEventCategories, (category: EventCategory, categoryAlias: string) => {
      const fieldSize = calculateFieldSize(eventBundle.hash, categoryAlias, combinedEventCategories)

      // Calculate upgrade points for each result
      const resultsWithUpgradePoints: CleanAthleteRaceResult[] = category.results.map((result) => {
        const upgradePoints = calculateBCUpgradePoints({
          position: result.position,
          fieldSize,
          eventType: sanctionedEventType,
        })

        return {
          ...result,
          upgradePoints,
        }
      })

      return {
        ...category,
        results: resultsWithUpgradePoints,
        fieldSize,
        combinedCategories: getCombinedRaceCategories(eventBundle.hash, categoryAlias),
      } as EventCategory
    })
  }

  // const baseCategories = Object.values(combinedEventCategories)
  //   .map((cat: EventCategory) => ( {
  //     alias: cat.alias,
  //     label: cat.label,
  //     startOffset: cat.startOffset,
  //     gender: cat.gender,
  //     laps: cat.laps,
  //   } ))
  //   .sort(sortByCategory)

  return {
    ...eventSummary,
    athletes: combinedAthletes,
    results: combinedEventCategories,
    sourceUrls: Object.keys(payloads).map(filename => SOURCE_URL_PREFIX + filename),
    raceNotes: combinedRaceNotes,
    lastUpdated: eventBundle.lastUpdated,
  }
}