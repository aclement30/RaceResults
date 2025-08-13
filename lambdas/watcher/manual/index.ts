import logger from '../../shared/logger.ts'
import { PROVIDER_NAME } from './config.ts'
import { listRefFiles } from './utils.ts'

import cleanData from './clean/index.ts'
import unpackData from '../unpack/index.ts'

export const handler = async (options: { year?: number, importRefFiles?: string[] }) => {
  logger.info(`Parser: ${PROVIDER_NAME}`)
  logger.info(`Options: ${JSON.stringify(options)}`)

  let importRefFiles = options.importRefFiles

  if (!importRefFiles?.length && options.year) {
    logger.info(`No import reference files provided, fetching list from S3 bucket...`)

    importRefFiles = await listRefFiles({ year: options.year })
  }

  if (!importRefFiles?.length) {
    logger.info(`No reference files found in S3 bucket for year ${options.year}, skipping manual import`)
    return {}
  }

  // Clean imported data
  const { hashes: cleanedHashes, year } = await cleanData(importRefFiles)

  // Unpack cleaned data for client-side usage
  const unpackedHashes = await unpackData({ year, hashes: cleanedHashes, provider: PROVIDER_NAME })

  return {
    statusCode: 200,
    body: JSON.stringify({
      year: options.year,
      clean: cleanedHashes,
      unpack: unpackedHashes,
      provider: PROVIDER_NAME
    }),
  }
}
