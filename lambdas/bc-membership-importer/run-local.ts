import { importRawData } from './import.ts'
import { cleanData } from './clean.ts'
import logger from '../shared/logger.ts'
import { ENV } from '../shared/config.ts'

const options = {
    year: 2026,
    // date: '2026-02-22',
    skipImport: false,
  }

;(async () => {
  logger.info(`ENV: ${ENV}`)

  if (options.skipImport) {
    logger.info('Skipping import of raw data')
  } else {
    await importRawData(options)
  }

  await cleanData()
})()