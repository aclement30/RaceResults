import data from 'shared/data.ts'
import defaultLogger from 'shared/logger.ts'
import type { BaseAthleteUpgradePoint } from 'shared/types.ts'
import { SCRIPT_NAME } from '../config.ts'

const logger = defaultLogger.child({ parser: SCRIPT_NAME })

export const cleanUpgradePoints = async ({ year, eventHashes }: {
  year: number,
  eventHashes: string[],
}) => {
  logger.info(`Cleaning athletes upgrade points for year ${year} (${eventHashes.length} events)...`)

  const promises = await Promise.allSettled(eventHashes.map(async (eventHash) => cleanEventUpgradePoints(eventHash, year)))

  promises.forEach((promise, i) => {
    if (promise.status !== 'fulfilled') {
      logger.error(`Error while cleaning event upgrade points: ${promise.reason}`, {
        year,
        eventHash: eventHashes[i],
        error: promise.reason
      })
    }
  })
}

const cleanEventUpgradePoints = async (eventHash: string, year: number) => {
  const [
    rawUpgradePoints,
    existingUpgradePoints,
  ] = await Promise.all([
    data.get.rawAthletesUpgradePoints(eventHash, year),
    data.get.athletesUpgradePoints({ eventHash, year }),
  ])

  let consolidatedUpgradePoints: BaseAthleteUpgradePoint[] = [
    ...existingUpgradePoints,
  ]

  rawUpgradePoints.forEach((athleteUpgradePoint) => {
    const { athleteUciId, eventHash, categoryAlias } = athleteUpgradePoint

    const existingPoint = consolidatedUpgradePoints.findIndex(point => point.athleteUciId === athleteUciId && point.eventHash === eventHash && point.categoryAlias === categoryAlias)
    if (existingPoint === -1) {
      consolidatedUpgradePoints.push(athleteUpgradePoint)
    } else {
      // Update existing point if necessary
      consolidatedUpgradePoints[existingPoint] = athleteUpgradePoint
    }
  })

  // Remove upgrade points older than 12 months
  const oneYearAgo = new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toLocaleDateString('sv', { timeZone: 'America/Vancouver' }).slice(0, 10)
  consolidatedUpgradePoints = consolidatedUpgradePoints.filter(point => point.date >= oneYearAgo)

  logger.info(`Saving upgrade points for ${consolidatedUpgradePoints.length} athletes for event ${eventHash}`)

  await data.update.athletesUpgradePoints(consolidatedUpgradePoints, { eventHash, year })
}