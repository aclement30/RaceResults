import { handler as CrossMgrLambda } from './cross-mgr/index.ts'
import { handler as WebscorerLambda } from './webscorer/index.ts'
import { handler as ManualImportLambda } from './manual/index.ts'
import { handler as AthleteLambda } from './athletes/index.ts'
import logger from '../shared/logger.ts'
import { ENV } from '../shared/config.ts'

const currentYear = 2025

const options = {
    year: currentYear,
    lastModifiedSince: new Date('2025-08-06T00:37:00.000Z'),
    parsers: {
      'cross-mgr': false,
      'webscorer': false,
      'manual-import': false,
      'athletes': true,
    },
    skipProfileUpload: false,
  }

;(async () => {
  logger.info(`ENV: ${ENV}`)

  if (options.parsers['cross-mgr']) {
    logger.info('Starting ingestion process for CrossMgr...')
    await CrossMgrLambda(options)
  }

  if (options.parsers['webscorer']) {
    logger.info('Starting ingestion process for Webscorer...')
    await WebscorerLambda(options)
  }

  if (options.parsers['manual-import']) {
    logger.info('Starting ingestion process for manual import...')
    await ManualImportLambda(options)
  }

  if (options.parsers['athletes']) {
    logger.info('Starting ingestion process for athletes...')
    await AthleteLambda(options)
  }
})()