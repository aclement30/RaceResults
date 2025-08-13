import { S3ServiceException } from '@aws-sdk/client-s3'
import { s3 as RRS3 } from '../../shared/utils.ts'
import { INGESTION_BASE_PATH } from '../../shared/config.ts'
import type { CleanEventWithResults, CleanSerieWithResults } from '../../shared/types.ts'
import { unpackEvent } from './event-unpack.ts'
import logger from '../../shared/logger.ts'
import { PUBLIC_BUCKET_PATHS } from '../../../src/config/s3.ts'
import { unpackSerie } from './serie-unpack.ts'
import type { EventSummary, SerieSummary } from '../../../src/types/results.ts'

const CLEAN_DATA_PATH = `${INGESTION_BASE_PATH}2-clean/`

export default async ({ year, hashes: updatedHashes, provider }: {
  year: number,
  hashes: string[],
  provider: string
}) => {
  const unpackedData = await Promise.allSettled(updatedHashes.map(async (hash) => {
    const filePath = `${CLEAN_DATA_PATH}${provider}/${year}/${hash}.json`

    const content = await RRS3.fetchFile(filePath)

    if (!content) throw new Error(`No content found for ${filePath}`)

    const eventOrSerieWithResults = JSON.parse(content) as CleanEventWithResults | CleanSerieWithResults
    const { type } = eventOrSerieWithResults

    if (type === 'event') {
      return unpackEvent(eventOrSerieWithResults as CleanEventWithResults)
    } else if (type === 'serie') {
      return unpackSerie(eventOrSerieWithResults as CleanSerieWithResults)
    } else {
      throw new Error(`Unsupported event type: ${type}`)
    }
  }))

  const unpackedHashes: string[] = []

  // Write unpacked data to S3 bucket
  for (const [index, importResult] of unpackedData.entries()) {
    if (importResult.status === 'rejected') {
      logger.error(`Failed to unpack data: ${importResult.reason}`, {
        hash: updatedHashes[index],
        error: importResult.reason
      })
      continue
    }

    const { summary, results } = importResult.value
    const { hash, type, year } = summary
    unpackedHashes.push(hash)

    let summaryPath
    let resultsPath
    if (type === 'event') {
      summaryPath = PUBLIC_BUCKET_PATHS.events
      resultsPath = PUBLIC_BUCKET_PATHS.eventsResults
    } else if (type === 'serie') {
      summaryPath = PUBLIC_BUCKET_PATHS.series
      resultsPath = PUBLIC_BUCKET_PATHS.seriesResults
    } else {
      throw new Error(`Unsupported event type: ${type}`)
    }

    const summaryFilePath = `${summaryPath}${year}.json`
    const resultsFilePath = `${resultsPath}${year}/${hash}.json`

    try {
      // Upload results first
      logger.info(`Uploading ${type} results for ${hash} to ${resultsFilePath}`)
      await RRS3.writeFile(resultsFilePath, JSON.stringify(results))

      // Download current events/series list
      let updatedSummaries: Array<EventSummary | SerieSummary> = await RRS3.fetchFile(summaryFilePath).then((fileContent) => {
        if (!fileContent?.length) return []

        return JSON.parse(fileContent)
      }).catch((error) => {
        if (error instanceof S3ServiceException && error.name === 'NoSuchKey') return []
      })

      logger.info(`${updatedSummaries.length} existing ${type}s found in ${summaryFilePath}`)

      if (updatedSummaries.find(e => e.hash === hash)) {
        // Replace existing event/serie
        updatedSummaries = updatedSummaries.filter(e => e.hash !== hash).concat([summary])
        logger.info(`Updating ${type} ${hash}`)
      } else {
        updatedSummaries.push(summary)
        logger.info(`Adding ${type} ${hash}`)
      }

      logger.info(`Uploading ${updatedSummaries.length} ${type}s to ${summaryFilePath}`)
      await RRS3.writeFile(summaryFilePath, JSON.stringify(updatedSummaries))
    } catch (err) {
      logger.error(`Failed to upload unpacked data for ${hash}: ${(err as any).message}`, { error: err, hash })
    }
  }

  return unpackedHashes
}