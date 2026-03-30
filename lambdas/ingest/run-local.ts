import { ENV } from 'shared/config.ts'
import logger from 'shared/logger.ts'
import { RuleEngine } from 'shared/rule-engine'
import { parseArgs } from 'util'
import { handler as CrossMgrLambda } from './cross-mgr/index.ts'
import { handler as ManualImportLambda } from './manual/index.ts'
import { handler as WebscorerLambda } from './webscorer/index.ts'

const { values: args } = parseArgs({
  args: process.argv.slice(2),
  options: { year: { type: 'string' } },
})

const options = {
    year: args.year ? +args.year : new Date().getFullYear(),
    // lastModifiedSince: new Date('2025-08-06T00:37:00.000Z'),
    parsers: {
      'cross-mgr': true,
      'webscorer': true,
      'manual-import': true,
    },
    forceOverwrite: false,
  }

;(async () => {
  logger.info(`ENV: ${ENV}`)

  await RuleEngine.init()

  if (options.parsers['cross-mgr']) {
    logger.info('Starting ingestion process for CrossMgr...')
    await CrossMgrLambda(options)
  }

  if (options.parsers['webscorer'] && options.year >= 2024) {
    logger.info('Starting ingestion process for Webscorer...')
    await WebscorerLambda(options)
  }

  if (options.parsers['manual-import']) {
    logger.info('Starting ingestion process for manual import...')
    await ManualImportLambda(options)
  }
})()