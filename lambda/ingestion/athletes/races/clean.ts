import defaultLogger from '../../shared/logger.ts'
import {
  CLEAN_ATHLETE_RACES_FILE,
  PARSER_NAME
} from '../config.ts'
import { s3 as RRS3 } from '../../shared/utils.ts'
import { S3ServiceException } from '@aws-sdk/client-s3'
import type {
  AthleteOverrides,
  CleanAthleteEventRaces,
  CleanAthleteRace
} from '../types.ts'
import { findAthleteUciId, validateUCIId } from '../utils.ts'

const logger = defaultLogger.child({ parser: PARSER_NAME })

export default async (
  athleteRaces: CleanAthleteRace[],
  athleteLookupTable: Record<string, string>,
  athleteOverrides: AthleteOverrides,
): Promise<CleanAthleteEventRaces> => {
  const existingAthleteRaces = await loadAthleteRaces()
  logger.info(`${Object.keys(existingAthleteRaces).length} athletes races found in: ${CLEAN_ATHLETE_RACES_FILE}`)

  const mergedAthleteRaces: Record<string, CleanAthleteRace[]> = {
    ...existingAthleteRaces
  }

  // Clean athlete races
  const cleanAthleteRaces = athleteRaces.map((athleteRace: CleanAthleteRace) => {
    let { athleteUciId, firstName, lastName, eventHash } = athleteRace

    if (athleteUciId && validateUCIId(athleteUciId)) return athleteRace

    athleteUciId = findAthleteUciId({ firstName, lastName }, athleteLookupTable, athleteOverrides) || undefined

    if (!athleteUciId) return null

    // Update athlete UCI ID to the one from the lookup table
    return {
      ...athleteRace,
      athleteUciId,
    }
  }).filter(race => !!race?.athleteUciId) as CleanAthleteRace[]

  cleanAthleteRaces.forEach((athleteRace) => {
    const { athleteUciId, eventHash } = athleteRace

    if (!mergedAthleteRaces[athleteUciId!]) {
      mergedAthleteRaces[athleteUciId!] = [athleteRace]
    } else {
      const existingRaceIndex = mergedAthleteRaces[athleteUciId!].findIndex(point => point.eventHash === eventHash)
      if (existingRaceIndex === -1) {
        mergedAthleteRaces[athleteUciId!].push(athleteRace)
      } else {
        // Update existing race if necessary
        mergedAthleteRaces[athleteUciId!][existingRaceIndex] = athleteRace
      }
    }
  })

  logger.info(`Saving clean athlete races for ${Object.keys(mergedAthleteRaces).length} races to: ${CLEAN_ATHLETE_RACES_FILE}`)

  try {
    await RRS3.writeFile(CLEAN_ATHLETE_RACES_FILE, JSON.stringify(mergedAthleteRaces))
  } catch (error) {
    logger.error(`Failed to save athlete races to ${CLEAN_ATHLETE_RACES_FILE}:` + (error as any).message, { error })
  }

  return mergedAthleteRaces
}

const loadAthleteRaces = async (): Promise<CleanAthleteEventRaces> => {
  try {
    const fileContent = await RRS3.fetchFile(CLEAN_ATHLETE_RACES_FILE)

    if (!fileContent) return {}

    const races: CleanAthleteEventRaces = JSON.parse(fileContent)

    return races
  } catch (error) {
    if (error instanceof S3ServiceException && error.name === 'NoSuchKey') {
      return {}
    }

    throw error
  }
}

