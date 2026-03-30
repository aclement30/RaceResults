import type { IngestEvent } from 'shared/types.ts'
import logger from '../../shared/logger.ts'
import cleanData from './clean/index.ts'
import { PROVIDER_NAME } from './config.ts'
import importData from './import/index.ts'

export const handler = async (options?: {
  year?: number,
  lastModifiedSince?: Date,
  eventHash?: string,
  forceOverwrite?: boolean,
}): Promise<IngestEvent> => {
  logger.info(`Parser: ${PROVIDER_NAME}`)
  logger.info(`Options: ${JSON.stringify(options)}`)

  // Import updated files since last check date
  const { year, hashes: importedHashes } = await importData(options)

  // Clean imported data
  const cleanedHashes = await cleanData({ year, sourceHashes: importedHashes, forceOverwrite: options?.forceOverwrite })

  return {
    year,
    eventHashes: cleanedHashes.events,
    seriesHashes: cleanedHashes.series,
    provider: PROVIDER_NAME
  }
}