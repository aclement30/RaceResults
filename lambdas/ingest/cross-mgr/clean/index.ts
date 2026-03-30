import data from 'shared/data.ts'
import defaultLogger from 'shared/logger.ts'
import { RuleEngine } from 'shared/rule-engine'
import { TeamParser } from 'shared/team-parser'
import type { UpdateEvent, UpdateSerie } from 'shared/types.ts'
import shortHash from 'short-hash'
import { PROVIDER_NAME } from '../config.ts'
import type { CrossMgrEventRawData, CrossMgrSerieRawData } from '../types.ts'
import { parseRawEvent } from './event-parser.ts'
import { parseRawSerie } from './serie-parser.ts'

const logger = defaultLogger.child({ provider: PROVIDER_NAME })

export default async ({ year, sourceHashes, forceOverwrite = false }: {
  year: number,
  sourceHashes: string[],
  forceOverwrite?: boolean,
}) => {
  await TeamParser.init()
  await RuleEngine.init()

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
      const subBundles = splitMixedEventBundles(bundleWithPayloads)
      const results = await Promise.allSettled(subBundles.map(b => cleanEvent(b, year, forceOverwrite)))

      const events = results.flatMap((result, i) => {
        if (result.status === 'rejected') {
          logger.error(`Failed to clean event bundle ${subBundles[i].hash}: ${result.reason}`, {
            error: result.reason,
            hash: subBundles[i].hash,
            year,
          })
          return []
        }
        return [result.value]
      })

      return { events }
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

  const allEvents: UpdateEvent[] = []
  const allSeries: UpdateSerie[] = []
  const cleanHashes: { events: string[]; series: string[] } = { events: [], series: [] }

  promises.forEach((promise, i) => {
    if (promise.status === 'rejected') {
      logger.error(`Error while cleaning data: ${promise.reason}`, {
        error: promise.reason,
        hash: sourceHashes[i],
        year,
      })
    } else {
      if (promise.value.events) {
        allEvents.push(...promise.value.events)
        cleanHashes.events.push(sourceHashes[i])
      } else if (promise.value.serie) {
        allSeries.push(promise.value.serie)
        cleanHashes.series.push(sourceHashes[i])
      }
    }
  })


  try {
    logger.info(`Saving ${allEvents.length} events for year ${year}...`)

    if (allEvents.length) {
      const { skippedEvents } = await data.update.events(allEvents, {
        year,
        updateSource: 'ingest',
        userId: 'system-ingest-lambda'
      })

      if (skippedEvents?.length) {
        logger.warn(`Skipped update for ${skippedEvents.length} events for year ${year}: ${skippedEvents}`, {
          skippedEvents,
          year,
        })
      }
    }
  } catch (err) {
    logger.error(`Failed to save event data: ${(err as any).message}`, {
      error: err,
    })
  }

  try {
    logger.info(`Saving ${allSeries.length} serie for ${year}...`)

    if (allSeries.length) {
      const { skippedSeries } = await data.update.series(allSeries, {
        year, updateSource: 'ingest',
        userId: 'system-ingest-lambda'
      })

      if (skippedSeries?.length) {
        logger.warn(`Skipped update for ${skippedSeries.length} series for year ${year}: ${skippedSeries}`, {
          skippedSeries,
          year,
        })
      }
    }
  } catch (err) {
    logger.error(`Failed to save serie data: ${(err as any).message}`, {
      error: err,
    })
  }

  return cleanHashes
}

const splitMixedEventBundles = (bundleWithPayloads: CrossMgrEventRawData): CrossMgrEventRawData[] => {
  const { payloads, ...bundle } = bundleWithPayloads

  const payloadEntries = Object.entries(payloads)
  const ttPayloads = Object.fromEntries(payloadEntries.filter(([, p]) => p.isTimeTrial))
  const roadPayloads = Object.fromEntries(payloadEntries.filter(([, p]) => !p.isTimeTrial))

  if (Object.keys(ttPayloads).length > 0 && Object.keys(roadPayloads).length > 0) {
    logger.warn(`Detected mixed TT/road payloads for ${bundle.hash} — splitting into two events`)
    return [
      { ...bundle, type: 'event' as const, payloads: roadPayloads },
      { ...bundle, type: 'event' as const, hash: shortHash(bundle.hash + '-tt'), payloads: ttPayloads },
    ]
  }

  return [bundleWithPayloads]
}

const cleanEvent = async (
  bundleWithPayloads: CrossMgrEventRawData,
  year: number,
  forceOverwrite = false
): Promise<UpdateEvent> => {
  const { payloads, ...bundle } = bundleWithPayloads
  const { event, eventResults } = await parseRawEvent(bundle, payloads)

  // If forceOverwrite is true, delete existing event and results to ensure clean state before update
  if (forceOverwrite) await data.delete.event(event.hash, year)

  await data.update.eventResults(eventResults, {
    year,
    updateSource: 'ingest',
    userId: 'system-ingest-lambda'
  })

  return event
}

const cleanSerie = async (
  bundleWithPayloads: CrossMgrSerieRawData,
  year: number,
  forceOverwrite = false
): Promise<UpdateSerie> => {
  const { payloads, ...bundle } = bundleWithPayloads

  const {
    serie,
    serieResults
  } = await parseRawSerie(bundle, payloads as CrossMgrSerieRawData['payloads'])

  // If forceOverwrite is true, delete existing serie and results to ensure clean state before update
  if (forceOverwrite) await data.delete.serie(serie.hash, year)

  await data.update.serieResults(serieResults, {
    year,
    updateSource: 'ingest',
    userId: 'system-ingest-lambda'
  })

  return serie
}