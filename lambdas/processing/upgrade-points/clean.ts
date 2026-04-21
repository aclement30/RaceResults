import data from 'shared/data.ts'
import defaultLogger from 'shared/logger.ts'
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
  const rawUpgradePoints = await data.get.rawAthletesUpgradePoints(eventHash, year)

  logger.info(`Saving ${rawUpgradePoints.length} upgrade points for event ${eventHash}`)

  await data.update.athletesUpgradePoints(rawUpgradePoints, { eventHash, year })
}