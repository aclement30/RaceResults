import type { Context, EventBridgeEvent } from 'aws-lambda'

import logger from '../shared/logger.ts'
import { ENV } from '../shared/config.ts'
import { PROVIDER_NAME } from './config.ts'

import { main as cleanData } from './clean/index.ts'
import { main as unpackData } from '../unpack/index.ts'
import { listRefFiles } from './utils.ts'

const currentYear = new Date().getFullYear()

export const handler = async (event?: EventBridgeEvent<any, any>, _: Context) => {
  logger.info(`ENV: ${ENV}`)

  let importRefFiles: string[] = []

  if (!importRefFiles?.length) {
    logger.info('No import reference files provided, fetching list from S3 bucket...')
    importRefFiles = await listRefFiles(currentYear)

    logger.info(`Found ${importRefFiles.length} reference files in S3 bucket`)
  }

  if (!importRefFiles.length) {
    logger.info(`No reference files found in S3 bucket for year ${currentYear}, skipping manual import`)
    return []
  }

  // Clean imported data
  const cleanedHashes = await cleanData({ year: currentYear, importRefFiles })

  // Unpack cleaned data for client-side usage
  const unpackedHashes = await unpackData({ year: currentYear, hashes: cleanedHashes, provider: PROVIDER_NAME })

  return {
    statusCode: 200,
    body: JSON.stringify({
      year: currentYear,
      clean: cleanedHashes,
      unpack: unpackedHashes,
      provider: PROVIDER_NAME
    }),
  }
}
