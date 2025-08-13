import { loadEventResults } from '../utils.ts'
import defaultLogger from '../../../shared/logger.ts'
import {
  EXTRACTED_RACES_FILE,
  PARSER_NAME
} from '../config.ts'
import type { CleanAthleteRace, StoredEventSummary } from '../types.ts'
import type { CleanEventAthlete, CleanEventResults } from '../../../shared/types.ts'
import { s3 as RRS3 } from '../../../shared/utils.ts'
import type { EventSummary } from '../../../../src/types/results.ts'
import { DEBUG } from '../../../shared/config.ts'

const logger = defaultLogger.child({ parser: PARSER_NAME })

export default async (storedEventFiles: StoredEventSummary[]) => {
  const extractionResults = await Promise.allSettled(storedEventFiles.map(async ({
    resultsFile,
    ...eventSummary
  }) => {
    const eventResults = await loadEventResults(resultsFile)

    // Extract all athletes upgrade points from event results
    const extractedRaces = await extractRaces(eventResults.results, eventResults.athletes, eventSummary)
    if (DEBUG) logger.info(`${eventSummary.hash} - ${eventSummary.name} (${eventSummary.date}): ${extractedRaces.length} athletes races found`)

    return extractedRaces
  }))

  let combinedAthleteRaces: CleanAthleteRace[] = []

  extractionResults.forEach((parseResult, i) => {
    if (parseResult.status === 'fulfilled') {
      combinedAthleteRaces = combinedAthleteRaces.concat(parseResult.value)
    } else {
      logger.error(`Error while processing event: ${parseResult.reason}`, {
        hash: storedEventFiles[i].hash,
        year: storedEventFiles[i].year,
        file: storedEventFiles[i].resultsFile,
        error: parseResult.reason
      })
    }
  })

  logger.info(`Total races extracted: ${combinedAthleteRaces.length}`)

  try {
    logger.info(`Uploading extracted races data to ${EXTRACTED_RACES_FILE}`)
    await RRS3.writeFile(EXTRACTED_RACES_FILE, JSON.stringify(combinedAthleteRaces))
  } catch (error) {
    console.trace(error)
    logger.error(`Failed to save extracted races: ${(error as Error).message}`, { error })
  }

  return combinedAthleteRaces
}

const extractRaces = (
  eventResults: CleanEventResults['results'], athletes: Record<string, CleanEventAthlete>,
  eventSummary: Pick<EventSummary, 'hash' | 'name' | 'date' | 'sanctionedEventType' | 'discipline'>
): CleanAthleteRace[] => {
  const athleteRaces: CleanAthleteRace[] = []

  Object.keys(eventResults).forEach((category) => {
    const categoryResults = eventResults[category].results

    // Skip umbrella categories
    if (eventResults[category].combinedCategories) return

    Object.values(categoryResults).forEach((athleteResult) => {
      const athlete = athletes[athleteResult.athleteId.toString()]

      if (!athlete) {
        logger.warn(`Athlete not found for id ${athleteResult.athleteId} in category ${category}, skipping race extraction`, {
          eventHash: eventSummary.hash,
        })
        return
      }

      if (!athlete.uciId && (!athlete.firstName || !athlete.lastName)) {
        if (athlete.firstName?.length || athlete.lastName?.length) {
          logger.warn(`Athlete ${athlete.firstName} ${athlete.lastName} has no UCI ID and partial name, skipping race extraction`, {
            eventHash: eventSummary.hash,
          })
        }
        return
      }

      athleteRaces.push({
        athleteUciId: athlete.uciId!,
        firstName: athlete.firstName,
        lastName: athlete.lastName,
        teamName: athlete.team,
        date: eventSummary.date,
        eventHash: eventSummary.hash,
        eventName: eventSummary.name,
        eventType: eventSummary.sanctionedEventType,
        discipline: eventSummary.discipline,
        category,
        categoryLabel: eventResults[category].label,
        position: athleteResult.position,
        status: athleteResult.status,
      })
    })
  })

  return athleteRaces
}