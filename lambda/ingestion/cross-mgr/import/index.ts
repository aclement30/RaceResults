import { getLastCheckDate, s3 as RRS3, setLastCheck } from '../../shared/utils.ts'
import type { CrossMgrEventBundle, CrossMgrEventResultPayload } from '../types.ts'
import defaultLogger from '../../shared/logger.ts'
import { fetchCrossMgrBucketFile, fetchEventBundlesForYear, groupEventFiles } from './bucket.ts'
import { PROVIDER_NAME, RAW_DATA_PATH } from '../config.ts'

const logger = defaultLogger.child({ provider: PROVIDER_NAME })

// If no `year` provided, fetch only updated files since last check date
export default async ({ year: requestedYear }: { year?: number } = {}) => {
  const { year, ...sourceBundles } = await getListOfSourceBundles(requestedYear)

  logger.info(`${sourceBundles.events?.length || 0} updated events`)
  logger.info(`${sourceBundles.series?.length || 0} updated series`)

  const importedRawData = await Promise.allSettled([
    ...sourceBundles.events,
    ...sourceBundles.series
  ].map(async (bundle) => {
    let payloads: Record<string, CrossMgrEventResultPayload | string> = {}

    if (bundle.type === 'event') {
      payloads = await fetchEventRawData(bundle.sourceFiles)
    } else if (bundle.type === 'serie') {
      payloads = await fetchSerieRawData(bundle.sourceFiles)
    } else {
      throw new Error(`Unsupported bundle type: ${bundle.type}`)
    }

    return {
      ...bundle,
      payloads,
    }
  }))

  const importedHashes: string[] = []

  // Write raw data to S3 bucket
  for (const importResult of importedRawData) {
    if (importResult.status === 'rejected') {
      logger.error(`Failed to import raw data: ${importResult.reason}`, { error: importResult.reason })
      continue
    }

    const { payloads, ...bundle } = importResult.value
    const { hash, year } = bundle

    importedHashes.push(hash)
    logger.info(`Importing raw data for ${bundle.type} ${year}/${bundle.hash} (${Object.keys(payloads).length} files)`)

    const filePath = `${RAW_DATA_PATH}${year}/${hash}.json`

    try {
      logger.info(`Uploading ${bundle.hash} raw data to ${filePath}`)
      await RRS3.writeFile(filePath, JSON.stringify(importResult.value))
    } catch (err) {
      logger.error(`Failed to upload raw data for ${bundle.type} "${bundle.hash}": ${(err as any).message}`, {
        error: err,
        hash: bundle.hash
      })
    }
  }

  return { year, hashes: importedHashes }
}

const getListOfSourceBundles = async (year?: number) => {
  let updatedSourceBundles: CrossMgrEventBundle[] = []
  let lastCheckDate: Date | null = null

  if (!year) {
    year = new Date().getFullYear()
    lastCheckDate = await getLastCheckDate(PROVIDER_NAME)
  }

  if (lastCheckDate) {
    logger.info(`Fetching updated source files since ${lastCheckDate}`)

    // Fetch event files changed since last check date
    updatedSourceBundles = await fetchEventBundlesForYear(year, { lastModifiedSince: lastCheckDate })
  } else {
    logger.info(`Fetching all source files for ${year}`)

    // Fetch all event files for specified year
    updatedSourceBundles = await fetchEventBundlesForYear(year)
  }

  let eventFiles = updatedSourceBundles.filter(e => e.type === 'event')
  const seriesFiles = updatedSourceBundles.filter(e => e.type === 'serie')

  if (eventFiles?.length) {
    let otherEventFiles: CrossMgrEventBundle[] = []

    for (const eventFile of eventFiles) {
      // Fetch other event files for the same organizer/year and series (eg. other categories of same event)
      const similarEventFiles = await fetchEventBundlesForYear(year, {
        organizer: eventFile.organizer,
        serie: eventFile.serie
      })

      otherEventFiles = otherEventFiles.concat(similarEventFiles.filter(e => e.type === 'event'))
    }

    // Consolidate all event files for the same date, organizer & type
    const consolidatedEventFiles = groupEventFiles([...eventFiles, ...otherEventFiles])
    eventFiles = consolidatedEventFiles.filter(e => e.type === 'event')
  }

  await setLastCheck(PROVIDER_NAME, new Date(), { events: eventFiles.length, series: seriesFiles.length })

  return {
    year,
    events: eventFiles,
    series: seriesFiles,
  }
}

const fetchEventRawData = async (sourceFiles: string[]) => {
  const payloads = await Promise.all(sourceFiles.map(async (filename: string) => {
    const content = await fetchCrossMgrBucketFile(filename)

    if (!content) throw new Error(`No content found for ${filename}`)

    const PAYLOAD_START_MARKER = /\/\* !!! payload begin !!! \*\/[^{]+\{/g
    const PAYLOAD_END_MARKER = /\}\s*;\s*\/\* !!! payload end !!! \*\//g

    let result = PAYLOAD_START_MARKER.exec(content)
    if (result == null) throw new Error('Could not find payload start for file "' + filename + '"')
    const pStart = PAYLOAD_START_MARKER.lastIndex - 1

    result = PAYLOAD_END_MARKER.exec(content)
    if (result == null) throw new Error('Could not find payload end for file "' + filename + '"')
    const pEnd = result.index + 1

    const payloadJson = content.substring(pStart, pEnd)
    const payload = JSON.parse(payloadJson) as CrossMgrEventResultPayload

    return payload
  }))

  return sourceFiles.reduce((acc, filename, index) => {
    acc[filename] = payloads[index]
    return acc
  }, {} as Record<string, CrossMgrEventResultPayload>)
}

const fetchSerieRawData = async (sourceFiles: string[]) => {
  const payloads = await Promise.all(sourceFiles.map(async (filename: string) => {
    const content = await fetchCrossMgrBucketFile(filename)

    if (!content) throw new Error(`No content found for ${filename}`)

    return content
  }))

  return sourceFiles.reduce((acc, filename, index) => {
    acc[filename] = payloads[index]
    return acc
  }, {} as Record<string, string>)
}