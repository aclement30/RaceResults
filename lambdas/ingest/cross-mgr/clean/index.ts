import type {
  CrossMgrEventRawData,
  CrossMgrSerieRawData
} from '../types.ts'
import { PROVIDER_NAME } from '../config.ts'
import defaultLogger from '../../../shared/logger.ts'
import { parseRawEvent } from './event-parser.ts'
import { parseRawSerie } from './serie-parser.ts'
import { TeamParser } from '../../../shared/team-parser.ts'
import data from '../../../shared/data.ts'
import type { RaceEvent, SerieSummary } from '../../../../src/types/results.ts'

const logger = defaultLogger.child({ provider: PROVIDER_NAME })

export default async ({ year, sourceHashes }: {
  year: number,
  sourceHashes: string[],
}) => {
  await TeamParser.init()

  const promises = await Promise.allSettled(sourceHashes.map(async (hash) => {
    let bundleWithPayloads: CrossMgrEventRawData | CrossMgrSerieRawData

    try {
      bundleWithPayloads = await data.get.rawIngestionData(PROVIDER_NAME, hash, year)
    } catch (err) {
      logger.error(`Failed to fetch raw ingestion data for ${year}/${hash}: ${(err as any).message}`, {
        error: err,
        hash,
        year,
      })

      throw new Error(`No raw ingestion data found for ${year}/${hash}`)
    }

    const { type } = bundleWithPayloads
    if (type === 'event') {
      const event = await cleanEvent(bundleWithPayloads, year)
      return { event }
    } else if (type === 'serie') {
      const serie = await cleanSerie(bundleWithPayloads, year)
      return { serie }
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
      } else if (promise.value.serie) {
        allSeries.push(promise.value.serie)
        cleanHashes.push(sourceHashes[i])
      }
    }
  })


  try {
    logger.info(`Saving ${allEvents.length} events for year ${year}...`)

    if (allEvents.length) {
      await data.update.events(allEvents, { year })
    }
  } catch (err) {
    logger.error(`Failed to save event data: ${(err as any).message}`, {
      error: err,
    })
  }

  try {
    logger.info(`Saving ${allSeries.length} serie for ${year}...`)

    if (allSeries.length) {
      await data.update.series(allSeries, { year })
    }
  } catch (err) {
    logger.error(`Failed to save serie data: ${(err as any).message}`, {
      error: err,
    })
  }

  return cleanHashes
}

const cleanEvent = async (
  bundleWithPayloads: CrossMgrEventRawData,
  year: number,
) => {
  const { payloads, ...bundle } = bundleWithPayloads

  const {
    event,
    eventResults
  } = parseRawEvent(bundle, payloads as CrossMgrEventRawData['payloads'])

  await data.update.eventResults(eventResults, { eventHash: event.hash, year })

  return event
}

const cleanSerie = async (
  bundleWithPayloads: CrossMgrSerieRawData,
  year: number,
) => {
  const { payloads, ...bundle } = bundleWithPayloads

  const {
    serie,
    serieResults
  } = parseRawSerie(bundle, payloads as CrossMgrSerieRawData['payloads'])

  await data.update.serieResults(serieResults, { eventHash: serieResults.hash, year })

  return serie
}