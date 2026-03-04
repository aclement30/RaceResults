import logger from '../../shared/logger.ts'
import { PROVIDER_NAME } from './config.ts'

import importData from './import.ts'
import cleanData from './clean/index.ts'

export const handler = async (options?: { year: number }) => {
  logger.info(`Parser: ${PROVIDER_NAME}`)
  logger.info(`Options: ${JSON.stringify(options)}`)

  let importedHashes: string[] = []
  let year: number

  if (!options?.year) {
    // // Import updated files since last check date
    // ({ year, hashes: importedHashes } = await importData())
  } else {
    // Import all files for the current year
    ({ year, hashes: importedHashes } = await importData({ year: options?.year }))
  }

  // Clean imported data
  const cleanedHashes = await cleanData({ year: year!, sourceHashes: importedHashes })

  return {
    statusCode: 200,
    body: JSON.stringify({
      year: year!,
      import: importedHashes,
      clean: cleanedHashes,
      provider: PROVIDER_NAME
    }),
  }
}