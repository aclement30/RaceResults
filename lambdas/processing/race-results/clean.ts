import { omit } from 'lodash-es'
import type {
  CleanAthleteRaceResult,
  RawAthleteRaceResult,
} from '../types.ts'
import { SCRIPT_NAME } from '../config.ts'
import defaultLogger from '../../shared/logger.ts'
import data from '../../shared/data.ts'
import { validateUCIId } from '../utils.ts'
import { AthleteFinder } from '../../shared/athlete-finder.ts'

const logger = defaultLogger.child({ parser: SCRIPT_NAME })

export const cleanRaceResults = async ({ year, eventHashes }: { year: number, eventHashes: string[] }): Promise<{
  athleteIds: string[]
}> => {
  await AthleteFinder.init()

  logger.info(`Cleaning athletes race results for year ${year} (${eventHashes.join(', ')})...`)

  const updatedAthleteIds = new Set<string>()

  const promises = await Promise.allSettled(eventHashes.map(async (eventHash) => cleanEventRaceResults(eventHash, year)))

  promises.forEach((promise, i) => {
    if (promise.status === 'fulfilled') {
      promise.value.athleteIds.forEach((id) => updatedAthleteIds.add(id))
    } else {
      logger.error(`Error while cleaning event race results: ${promise.reason}`, {
        year,
        eventHash: eventHashes[i],
        error: promise.reason
      })
    }
  })

  return { athleteIds: Array.from(updatedAthleteIds) }
}

const cleanEventRaceResults = async (eventHash: string, year: number) => {
  const eventRawRaceResults = await data.get.rawAthletesRaceResults(eventHash, year)

  const updatedAthleteIds: string[] = []
  let skippedResults = 0

  const cleanRaceResults: CleanAthleteRaceResult[] = eventRawRaceResults
  .map((raceResult: RawAthleteRaceResult) => {
    let { athleteUciId: rawAthleteUciId } = raceResult
    const { firstName, lastName } = raceResult
    let cleanAthleteUciId = rawAthleteUciId

    // If the raw UCI ID is present but invalid, set it to undefined to trigger the lookup by name
    if (cleanAthleteUciId && !validateUCIId(cleanAthleteUciId)) cleanAthleteUciId = undefined

    if (rawAthleteUciId && AthleteFinder.getReplacedUciId(rawAthleteUciId) !== rawAthleteUciId) {
      cleanAthleteUciId = AthleteFinder.getReplacedUciId(rawAthleteUciId)
    } else if (!cleanAthleteUciId && firstName && lastName) {
      cleanAthleteUciId = AthleteFinder.findAthleteUciId({ firstName, lastName }) || undefined
    }

    if (!cleanAthleteUciId) {
      skippedResults += 1
      return null
    }

    // Update athlete UCI ID to the one from the lookup table
    return {
      ...omit(raceResult, ['firstName', 'lastName']),
      athleteUciId: cleanAthleteUciId,
    }
  })
  .filter((race) => race !== null && !!race?.athleteUciId) as CleanAthleteRaceResult[]

  logger.info(`Saving ${cleanRaceResults.length} race results for event ${eventHash} (skipped: ${skippedResults})...`)

  updatedAthleteIds.push(...cleanRaceResults.map(r => r.athleteUciId))

  await data.update.athletesRacesResults(cleanRaceResults, { year, eventHash })

  return { athleteIds: updatedAthleteIds }
}