import { loadEventResults } from '../utils.ts'
import defaultLogger from '../../shared/logger.ts'
import {
  EXTRACTED_UPGRADE_POINTS_FILE,
  PARSER_NAME
} from '../config.ts'
import type { CleanAthleteEventUpgradePoint, StoredEventSummary } from '../types.ts'
import type { CleanEventAthlete, CleanEventResults } from '../../shared/types.ts'
import { s3 as RRS3 } from '../../shared/utils.ts'
import type { EventSummary } from '../../../../src/types/results.ts'
import { hasUpgradePoints } from '../../shared/upgrade-points.ts'
import { DEBUG } from '../../shared/config.ts'

const logger = defaultLogger.child({ parser: PARSER_NAME })

export default async (storedEventFiles: StoredEventSummary[]) => {
  const extractionResults = await Promise.allSettled(storedEventFiles.map(async ({
    resultsFile,
    ...eventSummary
  }) => {
    const eventResults = await loadEventResults(resultsFile)

    // Extract all athletes upgrade points from event results
    const extractedUpgradePoints = await extractUpgradePoints(eventResults.results, eventResults.athletes, eventSummary)
    if (DEBUG) logger.info(`${eventSummary.hash} - ${eventSummary.name} (${eventSummary.date}): ${extractedUpgradePoints.length} athlete upgrade points found`)

    return extractedUpgradePoints
  }))

  let combinedEventUpgradePoints: CleanAthleteEventUpgradePoint[] = []

  extractionResults.forEach((parseResult, i) => {
    if (parseResult.status === 'fulfilled') {
      combinedEventUpgradePoints = combinedEventUpgradePoints.concat(parseResult.value)
    } else {
      logger.error(`Error while processing event upgrade points: ${parseResult.reason}`, {
        hash: storedEventFiles[i].hash,
        year: storedEventFiles[i].year,
        file: storedEventFiles[i].resultsFile,
        error: parseResult.reason
      })
    }
  })

  logger.info(`Total upgrade points extracted: ${combinedEventUpgradePoints.length}`)

  try {
    logger.info(`Uploading extracted event upgrade points data to ${EXTRACTED_UPGRADE_POINTS_FILE}`)
    await RRS3.writeFile(EXTRACTED_UPGRADE_POINTS_FILE, JSON.stringify(combinedEventUpgradePoints))
  } catch (error) {
    console.trace(error)
    logger.error(`Failed to save extracted upgraded points: ${(error as Error).message}`, { error })
  }

  return combinedEventUpgradePoints
}

const extractUpgradePoints = (
  eventResults: CleanEventResults['results'], athletes: Record<string, CleanEventAthlete>,
  eventSummary: Pick<EventSummary, 'hash' | 'name' | 'date' | 'sanctionedEventType' | 'discipline'>
): CleanAthleteEventUpgradePoint[] => {
  const upgradePointsType = hasUpgradePoints(eventSummary.sanctionedEventType)
  const athleteUpgradePoints: CleanAthleteEventUpgradePoint[] = []

  Object.keys(eventResults).forEach((category) => {
    const fieldSize = eventResults[category].fieldSize || 0
    const categoryResults = eventResults[category].results
    const upgradePoints = eventResults[category].upgradePoints

    if (!upgradePoints) return

    Object.values(categoryResults).forEach((athleteResult) => {
      const athleteUpgradePointResult = upgradePoints.find(p => p.athleteId === athleteResult.athleteId)

      if (athleteUpgradePointResult) {
        const athlete = athletes[athleteResult.athleteId.toString()]

        if (!athlete) {
          logger.warn(`Athlete not found for id ${athleteResult.athleteId} in category ${category}, skipping upgrade points extraction`, {
            eventHash: eventSummary.hash,
          })
          return
        }

        if (!athlete.uciId && (!athlete.firstName || !athlete.lastName)) {
          logger.warn(`Athlete ${athlete.firstName} ${athlete.lastName} has no UCI ID and partial name, skipping upgrade points extraction`, {
            eventHash: eventSummary.hash,
          })
          return
        }

        athleteUpgradePoints.push({
          athleteUciId: athlete.uciId,
          firstName: athlete.firstName,
          lastName: athlete.lastName,
          date: eventSummary.date,
          eventHash: eventSummary.hash,
          eventName: eventSummary.name,
          eventType: eventSummary.sanctionedEventType,
          discipline: eventSummary.discipline,
          category: category,
          categoryLabel: eventResults[category].label,
          position: athleteUpgradePointResult.position,
          points: athleteUpgradePointResult.points,
          fieldSize,
          type: upgradePointsType as 'UPGRADE' | 'SUBJECTIVE',
        })
      }
    })
  })

  return athleteUpgradePoints
}