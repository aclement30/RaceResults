import defaultLogger from '../../shared/logger.ts'
import { CLEAN_ATHLETE_UPGRADE_POINTS_FILE, PARSER_NAME } from '../config.ts'
import { s3 as RRS3 } from '../../shared/utils.ts'
import { S3ServiceException } from '@aws-sdk/client-s3'
import type { AthleteOverrides, CleanAthleteEventUpgradePoint, CleanAthleteEventUpgradePoints } from '../types.ts'
import { findAthleteUciId, validateUCIId } from '../utils.ts'

const logger = defaultLogger.child({ parser: PARSER_NAME })

export default async (
  {
    athletesUpgradePoints,
    athletesLookupTable,
    athletesOverrides,
  }: {
    athletesUpgradePoints: CleanAthleteEventUpgradePoint[],
    athletesLookupTable: Record<string, string>,
    athletesOverrides: AthleteOverrides,
  }
): Promise<CleanAthleteEventUpgradePoints> => {
  const existingAthleteUpgradePointss = await loadAthleteUpgradePoints()
  logger.info(`${Object.keys(existingAthleteUpgradePointss).length} athletes upgrade points found in: ${CLEAN_ATHLETE_UPGRADE_POINTS_FILE}`)

  const mergedPoints: Record<string, CleanAthleteEventUpgradePoint[]> = {
    ...existingAthleteUpgradePointss
  }

  // Clean athlete upgrade points
  const cleanAthleteUpgradePoints = athletesUpgradePoints.map((point) => {
    let { athleteUciId, firstName, lastName, eventHash } = point

    if (athleteUciId && validateUCIId(athleteUciId)) return point

    athleteUciId = findAthleteUciId({ firstName, lastName }, athletesLookupTable, athletesOverrides) || undefined

    // Attempt to find athlete UCI ID by using the lookup table
    if (!athleteUciId) return null

    // Update athlete UCI ID to the one from the lookup table
    return {
      ...point,
      athleteUciId,
    }
  }).filter(point => !!point?.athleteUciId) as CleanAthleteEventUpgradePoint[]

  cleanAthleteUpgradePoints.forEach((athleteUpgradePoint) => {
    const { athleteUciId, eventHash } = athleteUpgradePoint

    if (!mergedPoints[athleteUciId!]) {
      mergedPoints[athleteUciId!] = [athleteUpgradePoint]
    } else {
      const existingPoint = mergedPoints[athleteUciId!].findIndex(point => point.eventHash === eventHash)
      if (existingPoint === -1) {
        mergedPoints[athleteUciId!].push(athleteUpgradePoint)
      } else {
        // Update existing point if necessary
        mergedPoints[athleteUciId!][existingPoint] = athleteUpgradePoint
      }
    }
  })

  logger.info(`Saving upgrade points for ${Object.keys(mergedPoints).length} athletes to: ${CLEAN_ATHLETE_UPGRADE_POINTS_FILE}`)

  try {
    await RRS3.writeFile(CLEAN_ATHLETE_UPGRADE_POINTS_FILE, JSON.stringify(mergedPoints))
  } catch (error) {
    logger.error(`Failed to save upgrade points to ${CLEAN_ATHLETE_UPGRADE_POINTS_FILE}:` + (error as any).message, { error })
  }

  return mergedPoints
}

const loadAthleteUpgradePoints = async (): Promise<CleanAthleteEventUpgradePoints> => {
  try {
    const fileContent = await RRS3.fetchFile(CLEAN_ATHLETE_UPGRADE_POINTS_FILE)

    if (!fileContent) return {}

    const upgradePoints: CleanAthleteEventUpgradePoints = JSON.parse(fileContent)

    return upgradePoints
  } catch (error) {
    if (error instanceof S3ServiceException && error.name === 'NoSuchKey') {
      return {}
    }

    throw error
  }
}

