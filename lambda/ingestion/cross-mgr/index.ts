import type { Context, EventBridgeEvent } from 'aws-lambda'

import logger from '../shared/logger.ts'
import { ENV } from '../shared/config.ts'
import { PROVIDER_NAME } from './config.ts'

import { main as importData } from './import/index.ts'
import { main as cleanData } from './clean/index.ts'
import { main as unpackData } from '../unpack/index.ts'

const currentYear = new Date().getFullYear()

export const handler = async (event?: EventBridgeEvent<any, any>, _: Context) => {
  logger.info(`ENV: ${ENV}`)

  let importedHashes: string[] = []
  let year: number

  if (event) {
    // Import updated files since last check date
    ({ year, hashes: importedHashes } = await importData())
  } else {
    // Import all files for the current year
    ({ year, hashes: importedHashes } = await importData({ year: currentYear }))
  }

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
