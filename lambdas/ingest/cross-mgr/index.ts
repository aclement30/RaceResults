import logger from '../../shared/logger.ts'
import { PROVIDER_NAME } from './config.ts'

import importData from './import/index.ts'
import cleanData from './clean/index.ts'

export const handler = async (options?: { year?: number, lastModifiedSince?: Date }) => {
  logger.info(`Parser: ${PROVIDER_NAME}`)
  logger.info(`Options: ${JSON.stringify(options)}`)

  // Import updated files since last check date
  const { year, hashes: importedHashes } = await importData(options)

  // Clean imported data
  const cleanedHashes = await cleanData({ year, sourceHashes: importedHashes })

  return {
    statusCode: 200,
    body: JSON.stringify({
      year,
      import: importedHashes,
      clean: cleanedHashes,
      provider: PROVIDER_NAME
    }),
  }
}