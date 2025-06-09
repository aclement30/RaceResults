import type { Context, EventBridgeEvent } from 'aws-lambda'

import logger from '../shared/logger.ts'
import { ENV } from '../shared/config.ts'
import { PARSER_NAME } from './config.ts'

import { main as extractData } from './extract/index.ts'
import defaultLogger from '../shared/logger.ts'
import { fetchEventResultFilesForYear, loadEventResults } from './utils.ts'
import { loadOverrides } from '../../parsers/athletes/aws-s3.ts'
import { extractEventAthletes } from './extract.ts'

const logger = defaultLogger.child({ parser: PARSER_NAME })

const currentYear = new Date().getFullYear()

export const handler = async (_: EventBridgeEvent<any, any>, __: Context) => {
  logger.info(`ENV: ${ENV}`)

  const yearStoredEventFiles = await fetchEventResultFilesForYear(currentYear)
  const athleteOverrides = await loadOverrides()

  await extractData(yearStoredEventFiles, athleteOverrides)

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
