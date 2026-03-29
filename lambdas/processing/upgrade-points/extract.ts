import { DEBUG } from 'shared/config.ts'
import data from 'shared/data.ts'
import defaultLogger from 'shared/logger.ts'
import type { BaseAthleteUpgradePoint } from 'shared/types.ts'
import { hasUpgradePoints } from 'shared/upgrade-points.ts'
import { SCRIPT_NAME } from '../config.ts'
import type { RawAthleteEventUpgradePoint } from '../types.ts'

const logger = defaultLogger.child({ parser: SCRIPT_NAME })

export const extractUpgradePoints = async ({ year, eventHashes }: {
  year: number,
  eventHashes: string[],
}) => {
  logger.info(`Extracting athletes upgrade points for year ${year} (${eventHashes.length} events)...`)

  const { allUpgradePoints } = await extractAllEventsUpgradePoints(eventHashes, year)

  await saveAllUpgradePoints(allUpgradePoints, year)
}

const extractAllEventsUpgradePoints = async (eventHashes: string[], year: number) => {
  const promises = await Promise.allSettled(eventHashes.map(async (eventHash) => extractUpgradePointsFromEvent(eventHash, year)))

  const allUpgradePoints: Record<string, BaseAthleteUpgradePoint[]> = {}

  promises.forEach((parseResult, i) => {
    const eventHash = eventHashes[i]

    if (parseResult.status === 'fulfilled') {
      const upgradePoints = parseResult.value

      allUpgradePoints[eventHashes[i]] = upgradePoints

      if (DEBUG) logger.info(`${eventHash} (${year}): ${upgradePoints.length} athletes upgrade points found`)
    } else {
      logger.error(`Error while processing event upgrade points: ${parseResult.reason}`, {
        hash: eventHashes[i],
        year,
        error: parseResult.reason
      })
    }
  })

  return { allUpgradePoints }
}

const extractUpgradePointsFromEvent = async (
  eventHash: string,
  year: number
): Promise<RawAthleteEventUpgradePoint[]> => {
  const eventRaceResults = await data.get.athletesRacesResults({ eventHash, year })

  if (!eventRaceResults || eventRaceResults.length === 0) return []

  const { eventType } = eventRaceResults[0]
  const upgradePointsType = hasUpgradePoints(eventType)

  if (!upgradePointsType) {
    logger.warn(`Event ${eventHash} (${year}) of type ${eventType} does not have upgrade points, skipping extraction`)
    return []
  }

  const athleteUpgradePoints: RawAthleteEventUpgradePoint[] = []

  eventRaceResults.forEach((raceResult) => {
    if (!raceResult.upgradePoints) return

    athleteUpgradePoints.push({
      ...raceResult,
      position: raceResult.position!,
      points: raceResult.upgradePoints,
      fieldSize: raceResult.fieldSize,
      type: upgradePointsType,
    })
  })

  return athleteUpgradePoints
}

const saveAllUpgradePoints = async (allUpgradePoints: Record<string, BaseAthleteUpgradePoint[]>, year: number) => {
  const promises = await Promise.allSettled(
    Object.entries(allUpgradePoints).map(
      ([eventHash, upgradePoints]) => data.update.rawAthletesUpgradePoints(upgradePoints, { eventHash, year })
    )
  )

  promises.forEach((result, i) => {
    const eventHash = Object.keys(allUpgradePoints)[i]
    const upgradePoints = allUpgradePoints[eventHash]

    if (result.status === 'fulfilled') {
      logger.info(`Saved ${upgradePoints.length} raw upgrade points for event ${eventHash}`)
    } else {
      logger.error(`Error while saving raw upgrade points: ${result.reason}`, {
        hash: eventHash,
        year,
        error: result.reason
      })
    }
  })
}