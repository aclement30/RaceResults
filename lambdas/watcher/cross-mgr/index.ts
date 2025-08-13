import logger from '../../shared/logger.ts'
import { PROVIDER_NAME } from './config.ts'

import importData from './import/index.ts'
import cleanData from './clean/index.ts'
import unpackData from '../unpack/index.ts'

export const handler = async (options?: { year?: number, lastModifiedSince?: Date }) => {
  logger.info(`Parser: ${PROVIDER_NAME}`)
  logger.info(`Options: ${JSON.stringify(options)}`)

  // Import updated files since last check date
  const { year, hashes: importedHashes } = await importData(options)

  // Clean imported data
  const cleanedHashes = await cleanData({ year, sourceHashes: importedHashes })

  // Unpack cleaned data for client-side usage
  const unpackedHashes = await unpackData({ year, hashes: cleanedHashes, provider: PROVIDER_NAME })

  return {
    statusCode: 200,
    body: JSON.stringify({
      year,
      import: importedHashes,
      clean: cleanedHashes,
      unpack: unpackedHashes,
      provider: PROVIDER_NAME
    }),
  }
}