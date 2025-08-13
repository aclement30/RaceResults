import { mapValues } from 'lodash-es'
import defaultLogger from '../../../shared/logger.ts'
import { CLEAN_ATHLETE_UPGRADE_POINTS_FILE, PARSER_NAME } from '../config.ts'
import { s3 as RRS3 } from '../../../shared/utils.ts'
import { S3ServiceException } from '@aws-sdk/client-s3'
import type { AthleteOverrides, CleanAthleteEventUpgradePoint, CleanAthleteEventUpgradePoints } from '../types.ts'
import { findAthleteUciId, validateUCIId } from '../utils.ts'

const logger = defaultLogger.child({ parser: PARSER_NAME })

export default async (
  {
    athletesUpgradePoints,
    athletesLookupTable,
    year,
    athletesOverrides,
  }: {
    athletesUpgradePoints: CleanAthleteEventUpgradePoint[],
    athletesLookupTable: Record<string, string>,
    year: number,
    athletesOverrides: AthleteOverrides,
  }
): Promise<CleanAthleteEventUpgradePoints> => {
  const existingAthleteUpgradePoints = await loadAthleteUpgradePoints()
  logger.info(`${Object.keys(existingAthleteUpgradePoints).length} athletes upgrade points found in: ${CLEAN_ATHLETE_UPGRADE_POINTS_FILE}`)

  // Filter out existing points for the current year (will be replaced with the new `athletesUpgradePoints`)
  const filteredExistingPoints = Object.entries(existingAthleteUpgradePoints).reduce((acc, [athleteUciId, points]) => {
    acc[athleteUciId] = points.filter(point => point.date.slice(0, 4) !== year.toString())
    return acc
  }, {} as CleanAthleteEventUpgradePoints)

  let mergedPoints: CleanAthleteEventUpgradePoints = {
    ...filteredExistingPoints
  }

  // Clean athlete upgrade points
  const cleanAthleteUpgradePoints = athletesUpgradePoints.map((point) => {
    let { athleteUciId, firstName, lastName } = point

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
    const { athleteUciId, eventHash, category } = athleteUpgradePoint

    if (!mergedPoints[athleteUciId!]) {
      mergedPoints[athleteUciId!] = [athleteUpgradePoint]
    } else {
      const existingPoint = mergedPoints[athleteUciId!].findIndex(point => point.eventHash === eventHash && point.category === category)
      if (existingPoint === -1) {
        mergedPoints[athleteUciId!].push(athleteUpgradePoint)
      } else {
        // Update existing point if necessary
        mergedPoints[athleteUciId!][existingPoint] = athleteUpgradePoint
      }
    }
  })

  // Remove upgrade points older than 12 months
  const oneYearAgo = new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toLocaleDateString('sv', { timeZone: 'America/Vancouver' }).slice(0, 10)
  mergedPoints = mapValues(mergedPoints, (points) => points.filter(point => point.date >= oneYearAgo))

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

    return JSON.parse(fileContent) as CleanAthleteEventUpgradePoints
  } catch (error) {
    if (error instanceof S3ServiceException && error.name === 'NoSuchKey') {
      return {}
    }

    throw error
  }
}

