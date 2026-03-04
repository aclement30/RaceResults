import { PROVIDER_NAME } from '../config.ts'
import defaultLogger from '../../../shared/logger.ts'
import { parseRawEvent } from './event-parser.ts'
import { TeamParser } from '../../../shared/team-parser.ts'
import type { WebscorerEventRawData } from '../types.ts'
import data from '../../../shared/data.ts'
import type { RaceEvent, SerieSummary } from '../../../shared/types.ts'

const logger = defaultLogger.child({ provider: PROVIDER_NAME })

export default async ({ year, sourceHashes }: {
  year: number,
  sourceHashes: string[],
}) => {
  await TeamParser.init()

  const promises = await Promise.allSettled(sourceHashes.map(async (hash) => {
    let bundleWithPayload: WebscorerEventRawData

    try {
      bundleWithPayload = await data.get.rawIngestionData(PROVIDER_NAME, hash, year)
    } catch (err) {
      logger.error(`Failed to fetch raw ingestion data for ${year}/${hash}: ${(err as any).message}`, {
        error: err,
        hash,
        year,
      })

      throw new Error(`No raw ingestion data found for ${year}/${hash}`)
    }

    const { type } = bundleWithPayload
    if (type === 'event') {
      const event = await cleanEvent(bundleWithPayload, year)
      return { event }
    } else {
      logger.error(`Unsupported bundle type: ${type} for ${year}/${hash}`, {
        hash,
        year,
        type,
      })

      throw new Error(`Unsupported bundle type: ${type}`)
    }
  }))

  const allEvents: RaceEvent[] = []
  const allSeries: SerieSummary[] = []
  const cleanHashes: string[] = []

  promises.forEach((promise, i) => {
    if (promise.status === 'rejected') {
      logger.error(`Error while cleaning data: ${promise.reason}`, {
        error: promise.reason,
        hash: sourceHashes[i],
        year,
      })
    } else {
      if (promise.value.event) {
        allEvents.push(promise.value.event)
        cleanHashes.push(sourceHashes[i])
      } else {
        throw new Error(`Unsupported data type for ${year}/${sourceHashes[i]}`)
      }
    }
  })

  try {
    logger.info(`Saving ${allEvents.length} events for year ${year}...`)

    await data.update.events(allEvents, { year })
  } catch (err) {
    logger.error(`Failed to save event data: ${(err as any).message}`, {
      error: err,
    })
  }

  // try {
  //   logger.info(`Saving ${allSeries.length} serie for ${year}...`)
  //
  //   await data.update.series(allSeries, { year })
  // } catch (err) {
  //   logger.error(`Failed to save serie data: ${(err as any).message}`, {
  //     error: err,
  //   })
  // }

  return cleanHashes
}

const cleanEvent = async (
  bundleWithPayload: WebscorerEventRawData,
  year: number,
) => {
  const { payload, ...bundle } = bundleWithPayload

  const {
    event,
    eventResults
  } = parseRawEvent(bundle, payload)
  
  await data.update.eventResults(eventResults, { eventHash: event.hash, year })

  return event
}