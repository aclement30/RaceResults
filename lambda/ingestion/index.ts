import { handler as CrossMgrLambda } from './cross-mgr/index.ts'
import { handler as ManualImportLambda } from './manual/index.ts'
import logger from './shared/logger.ts'
import { ENV } from './shared/config.ts'

(async () => {
  logger.info(`ENV: ${ENV}`)

  logger.info('Starting ingestion process for CrossMgr...')

  // await CrossMgrLambda()

  logger.info('Starting ingestion process for manual import...')

  // await ManualImportLambda()
})()