import logger from '../../shared/logger.ts'
import { PROVIDER_NAME } from './config.ts'

import importData from './import.ts'
import cleanData from './clean/index.ts'
import { IngestEvent } from '../../shared/types'

export const handler = async (options?: { year: number, eventHash?: string }): Promise<IngestEvent> => {
  logger.info(`Parser: ${PROVIDER_NAME}`)
  logger.info(`Options: ${JSON.stringify(options)}`)

  let importedHashes: string[] = []
  let year: number

  if (!options?.year) {
    // // Import updated files since last check date
    // ({ year, hashes: importedHashes } = await importData())
  } else {
    // Import all files for the current year
    ({ year, hashes: importedHashes } = await importData(options))
  }

  // Clean imported data
  const cleanedHashes = await cleanData({ year: year!, sourceHashes: importedHashes })

  return {
    year: year!,
    eventHashes: cleanedHashes,
    seriesHashes: [], // No series in Webscorer
    provider: PROVIDER_NAME
  }
}