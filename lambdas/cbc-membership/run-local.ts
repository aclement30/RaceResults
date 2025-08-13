import { importRawData } from './import.ts'
import { cleanData } from './clean.ts'
import logger from '../shared/logger.ts'
import { ENV } from '../shared/config.ts'

const options = {
    year: 2025,
    outputFile: undefined,
    skipImport: true,
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