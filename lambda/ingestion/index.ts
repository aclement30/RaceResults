import { handler as CrossMgrLambda } from './cross-mgr/index.ts'
import { handler as ManualImportLambda } from './manual/index.ts'
import { handler as AthleteLambda } from './athletes/index.ts'
import logger from './shared/logger.ts'
import { ENV } from './shared/config.ts'

const currentYear = new Date().getFullYear()

const options = {
    year: currentYear
  }

;(async () => {
  logger.info(`ENV: ${ENV}`)

  logger.info('Starting ingestion process for CrossMgr...')

  await CrossMgrLambda(options)

  logger.info('Starting ingestion process for manual import...')

  await ManualImportLambda(options)

  logger.info('Starting ingestion process for athletes...')

  await AthleteLambda(options)
})()