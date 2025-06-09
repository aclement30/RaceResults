import type {
  CrossMgrEventBundle,
  CrossMgrEventRawData,
  CrossMgrSerieRawData
} from '../types.ts'
import { s3 as RRS3 } from '../../shared/utils.ts'
import { CLEAN_DATA_PATH, PROVIDER_NAME, RAW_DATA_PATH } from '../config.ts'
import defaultLogger from '../../shared/logger.ts'
import { parseEvent } from './event-parser.ts'
import { parseSerie } from './serie-parser.ts'

const logger = defaultLogger.child({ provider: PROVIDER_NAME })

export const main = async ({ year, sourceHashes }: { year: number, sourceHashes: string[] }) => {
  const cleanData = await Promise.allSettled(sourceHashes.map(async (hash) => {
    const filePath = `${RAW_DATA_PATH}${year}/${hash}.json`
    const content = await RRS3.fetchFile(filePath)

    if (!content) throw new Error(`No content found for ${filePath}`)

    const bundleWithPayloads = JSON.parse(content) as CrossMgrEventRawData | CrossMgrSerieRawData

    const { payloads, ...bundle } = bundleWithPayloads

    if (bundle.type === 'event') {
      return parseEvent(bundle, payloads as CrossMgrEventRawData['payloads'])
    } else if (bundle.type === 'serie') {
      return parseSerie(bundle, payloads as CrossMgrSerieRawData['payloads'])
    } else {
      throw new Error(`Unsupported event type: ${(bundle as CrossMgrEventBundle).type}`)
    }
  }))

  const cleanHashes: string[] = []

  // Write clean data to S3 bucket
  for (const [index, importResult] of cleanData.entries()) {
    if (importResult.status === 'rejected') {
      logger.error(`Failed to parse raw data: ${importResult.reason}`, {
        error: importResult.reason,
        hash: sourceHashes[index],
        year,
      })
      continue
    }

    const { hash } = importResult.value
    cleanHashes.push(hash)

    const filePath = `${CLEAN_DATA_PATH}${year}/${hash}.json`

    try {
      logger.info(`Uploading ${year}/${hash} clean data to ${filePath}`, { hash })
      await RRS3.writeFile(filePath, JSON.stringify(importResult.value))
    } catch (err) {
      logger.error(`Failed to upload clean data for ${year}/${hash}: ${(err as any).message}`, { error: err, hash })
    }
  }

  return cleanHashes
}