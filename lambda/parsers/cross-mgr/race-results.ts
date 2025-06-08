import { fetchResultPayloads } from './aws-s3.ts'
import type { CrossMgrEventFile, CrossMgrEventResultPayload } from './types.ts'
import type {
  EventCategory,
  AthleteRaceResult,
  Athlete, EventSummary, EventResults
} from '../../../src/types/results.ts'
import _ from 'lodash'
import { formatCategoryAlias, sortByCategory } from '../shared/utils.ts'
import {
  formatRaceNotes,
  transformCategory,
  transformOrganizer,
  transformSerieAlias
} from './utils.ts'

export const SOURCE_URL_PREFIX = 'https://results.wimsey.co/'

export async function getFullEventWithResults(crossMgrEvent: Omit<CrossMgrEventFile, 'files'>, sourceFiles: string[]) {
  const payloads = await fetchResultPayloads(sourceFiles)

  const raceEvent = shapeCrossMgrEventInfoAndResults(payloads, crossMgrEvent, sourceFiles)

  return {
    ...raceEvent,
    type: 'event',
  }
}

function shapeCrossMgrEventInfoAndResults(payloads: CrossMgrEventResultPayload[], crossMgrEvent: Omit<CrossMgrEventFile, 'files'>, sourceFiles: string[]): {
  summary: EventSummary,
  results: EventResults
} {
  const eventName = _.startCase(payloads[0].raceNameText.split('-')[0])

  const eventSummary: EventSummary = {
    hash: crossMgrEvent.hash,
    date: crossMgrEvent.date!,
    year: crossMgrEvent.year,
    ...transformOrganizer(crossMgrEvent.organizer, payloads[0].organizer),
    organizerEmail: payloads[0].email,
    name: eventName,
    // flags: payloads[0].flags,
    isTimeTrial: payloads[0].isTimeTrial,
    series: transformSerieAlias(crossMgrEvent.series, crossMgrEvent.organizer) || null,
    provider: 'cross-mgr',
    categories: [],
  }

  const combinedAthleteData = payloads.reduce((acc, payload) => {
    if (!payload.data) return acc

    Object.keys(payload.data).forEach((bibNumber) => {
      acc![bibNumber] = payload.data![bibNumber]
    })

    return acc
  }, {} as CrossMgrEventResultPayload['data'])

  const combinedPrimes = payloads.reduce((acc, payload) => {
    if (payload.primes) {
      payload.primes.forEach((prime) => {
        acc.push(prime)
      })
    }

    return acc
  }, [] as CrossMgrEventResultPayload['primes'])

  const combinedEventCategories = payloads.reduce((acc, payload) => {
    if (!payload.catDetails) return acc

    payload.catDetails.forEach((cat) => {
      const categoryName = transformCategory(cat.name, eventSummary)
      const categoryGender = cat.gender === 'Men' ? 'M' : cat.gender === 'Women' ? 'F' : 'X'
      const alias = formatCategoryAlias(categoryName)

      if (cat.name !== 'All') {
        const athleteRaceResults: AthleteRaceResult[] = cat.pos.map((bibNumber, index) => {
          const athleteData = combinedAthleteData![bibNumber]

          if (!athleteData) {
            console.log('Error: cannot find athlete data for bib #' + bibNumber, `(category: ${cat.name})`)
            console.log(combinedAthleteData)
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
        })

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

  const combinedAthletes = payloads.reduce((acc, payload) => {
    if (!payload.data) return acc

    Object.keys(payload.data).forEach((bibNumber) => {
      const resultRow = payload.data![bibNumber]
      const racerGender = resultRow.Gender === 'Men' ? 'M' : resultRow.Gender === 'Women' ? 'F' : 'X'

      acc[bibNumber] = {
        bibNumber: +bibNumber,
        firstName: resultRow.FirstName,
        lastName: resultRow.LastName,
        age: resultRow.Age,
        gender: racerGender,
        city: resultRow.City,
        state: resultRow.StateProv?.replace('British Columbia', 'BC') || null,
        license: resultRow.License,
        uciId: resultRow.UCIID,
        team: resultRow.Team,
      }
    })

    return acc
  }, {} as Record<string, Athlete>)

  const combinedRaceNotes = payloads.reduce((acc, payload) => {
    if (payload.raceNotes?.trim().length) acc = acc += formatRaceNotes(payload.raceNotes) + '<br />'
    return acc
  }, '')

  const baseCategories = Object.values(combinedEventCategories)
    .map((cat: EventCategory) => ({
      alias: cat.alias,
      label: cat.label,
      startOffset: cat.startOffset,
      gender: cat.gender,
      laps: cat.laps,
    }))
    .sort(sortByCategory)

  return {
    summary: {
      ...eventSummary,
      categories: baseCategories,
    },
    results: {
      hash: eventSummary.hash,
      athletes: combinedAthletes,
      results: combinedEventCategories,
      sourceUrls: sourceFiles.map(filename => SOURCE_URL_PREFIX + filename),
      raceNotes: combinedRaceNotes,
      lastUpdated: crossMgrEvent.lastUpdated,
    }
  }
}