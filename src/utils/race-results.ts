import { fetchFile, type GroupedEventFile } from './aws-s3'
import type { CrossMgrEventResultPayload } from '../types/CrossMgr.ts'
import type {
  EventInfo,
  EventCategory,
  AthleteRaceResult,
  EventStats,
  Athlete
} from '../types/results.ts'
import type { BaseEvent } from './loadStartupData'

export async function fetchResultPayloads(filenames: string[]) {
  const payloads = await Promise.all(filenames.map(async (filename: string) => {
    const content = await fetchFile(filename)

    const PAYLOAD_START_MARKER = /\/\* !!! payload begin !!! \*\/[^{]+\{/g
    const PAYLOAD_END_MARKER = /\}\s*;\s*\/\* !!! payload end !!! \*\//g

    let result = PAYLOAD_START_MARKER.exec(content)
    if (result == null) throw new Error('Could not find payload start for file "' + filename + '"')
    let pStart = PAYLOAD_START_MARKER.lastIndex - 1

    result = PAYLOAD_END_MARKER.exec(content)
    if (result == null) throw new Error('Could not find payload end for file "' + filename + '"')
    let pEnd = result.index + 1

    const payloadJson = content.substring(pStart, pEnd)
    const payload = JSON.parse(payloadJson)

    return payload
  }))

  return payloads
}

export async function getFullEventWithResults(event: BaseEvent, sourceFiles: string[]) {
  const payloads = await fetchResultPayloads(sourceFiles)

  const { eventInfo, results } = shapeCrossMgrEventInfoAndResults(payloads, event)

  return { eventInfo, results }
}

const formatCrossMgrCategoryAlias = (catName: string): string => {
  const alias = catName.toLowerCase().replace('(men)', 'm').replace('(women)', 'w').replace('(open)', 'x').replace(/[\s\/]/g, '-').trim()

  return alias
}

export function shapeCrossMgrEventInfoAndResults(payloads: CrossMgrEventResultPayload[], event: BaseEvent): {
  eventInfo: EventInfo,
  results: EventStats
} {
  const eventInfo: EventInfo = {
    ...event,
    organizer: payloads[0].organizer,
    organizerEmail: payloads[0].email,
    // flags: payloads[0].flags,
    isTimeTrial: payloads[0].isTimeTrial,
  }

  console.log({ eventInfo })
  const combinedAthleteData = payloads.reduce((acc, payload) => {
    Object.keys(payload.data).forEach((bibNumber) => {
      acc[bibNumber] = payload.data[bibNumber]
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
    payload.catDetails.forEach((cat) => {
      const categoryGender = cat.gender === 'Men' ? 'M' : cat.gender === 'Women' ? 'F' : 'X'
      const alias = formatCrossMgrCategoryAlias(cat.name)

      if (cat.name !== 'All') {
        const athleteRaceResults: AthleteRaceResult[] = cat.pos.map((bibNumber, index) => {
          const athleteData = combinedAthleteData[bibNumber]

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
            avgSpeed: +( athleteData.speed.replace('km/h', '').trim() ),
            status: athleteData.status.toUpperCase() as 'FINISHER' | 'DNF' | 'DNS' | 'OTL',
            relegated: athleteData.relegated,
            finishTime: athleteData.lastTime - ( athleteData.raceTimes?.[0] || 0 ),
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
          label: cat.name.replace('(Men)', '(M)').replace('(Women)', '(W)'),
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
        }
      }
    })

    return acc
  }, {} as Record<string, EventCategory>)

  const combinedAthletes = payloads.reduce((acc, payload) => {
    Object.keys(payload.data).forEach((bibNumber) => {
      const resultRow = payload.data[bibNumber]
      const racerGender = resultRow.Gender === 'Men' ? 'M' : resultRow.Gender === 'Women' ? 'F' : 'X'

      acc[bibNumber] = {
        bibNumber: +bibNumber,
        firstName: resultRow.FirstName,
        lastName: resultRow.LastName,
        age: resultRow.Age,
        gender: racerGender,
        city: resultRow.City,
        state: resultRow.StateProv,
        license: resultRow.License,
        uciId: resultRow.UCIID,
        team: resultRow.Team,
      }
    })

    return acc
  }, {} as Record<string, Athlete>)

  const baseCategories = Object.values(combinedEventCategories)
    .map((cat: EventCategory) => ( {
      alias: cat.alias,
      label: cat.label,
      startOffset: cat.startOffset,
      gender: cat.gender,
      laps: cat.laps,
    } ))
    .sort((a, b) => a.label < b.label ? -1 : 1)

  return {
    eventInfo,
    results: {
      athletes: combinedAthletes,
      categories: baseCategories,
      results: combinedEventCategories,
    }
  }
}

export function formatTimeDuration(seconds: number): string {
  if (seconds >= 3600) {
    return new Date(seconds * 1000).toISOString().slice(11, 19)
  } else {
    return new Date(seconds * 1000).toISOString().slice(14, 19)
  }
}

export function formatGapTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)

  if (seconds >= 3600) {
    // Response format should be hh mm'ss"
    // const minutes = Math.floor((seconds % 3600) / 60)
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes
    const formattedSeconds = remainingSeconds < 10 ? `0${remainingSeconds}` : remainingSeconds

    return `+ ${hours}h ${formattedMinutes}' ${formattedSeconds}"`
  } else if (seconds >= 60) {
    // Response format should be mm'ss"
    const formattedSeconds = remainingSeconds < 10 ? `0${remainingSeconds}` : remainingSeconds

    return `+ ${minutes}' ${formattedSeconds}"`
  } else {
    if (remainingSeconds < 0) return '-'

    // Response format should be ss"
    return `+ ${remainingSeconds}"`
  }
}

export function formatSpeed(speed: number) {
  return speed.toFixed(2)
}