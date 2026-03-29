import data from 'shared/data.ts'
import defaultLogger from 'shared/logger.ts'
import { PROVIDER_NAME } from '../config.ts'
import type {
  CrossMgrEventBundle,
  CrossMgrEventRawData,
  CrossMgrEventResultPayload,
  CrossMgrSerieRawData,
} from '../types.ts'
import { fetchCrossMgrBucketFile, fetchEventBundlesForYear, groupEventFiles } from './bucket.ts'

const logger = defaultLogger.child({ provider: PROVIDER_NAME })

// If no `year` provided, fetch only updated files since last check date
export default async ({ year: requestedYear, lastModifiedSince, eventHash }: {
  year?: number,
  lastModifiedSince?: Date
  eventHash?: string
} = {}) => {
  const { year, ...sourceBundles } = await getListOfSourceBundles({ year: requestedYear, lastModifiedSince })

  logger.info(`${sourceBundles.events?.length || 0} updated events`)
  logger.info(`${sourceBundles.series?.length || 0} updated series`)

  const combinedBundles = [...(sourceBundles.events || []), ...(sourceBundles.series || [])]

  const filteredBundles = eventHash ? combinedBundles.filter(bundle => bundle.hash === eventHash) : combinedBundles

  const promises = await Promise.allSettled(filteredBundles.map(bundle => importRawData(bundle, year)))

  const importedHashes = promises.filter((promise) => promise.status === 'fulfilled').map((promise) => promise.value)

  return { year, hashes: importedHashes }
}

const importRawData = async (bundle: CrossMgrEventBundle, year: number) => {
  logger.info(`Importing raw data for ${bundle.type} ${year}/${bundle.hash}`)

  let payloads

  if (bundle.type === 'event') {
    payloads = await fetchEventRawData(bundle.sourceFiles)
  } else if (bundle.type === 'serie') {
    payloads = await fetchSerieRawData(bundle.sourceFiles)
  } else {
    throw new Error(`Unsupported bundle type: ${bundle.type}`)
  }

  try {
    await data.update.rawIngestionData({ ...bundle, payloads }, {
      provider: PROVIDER_NAME,
      year,
      eventHash: bundle.hash
    })
  } catch (err) {
    logger.error(`Failed to upload raw data for ${bundle.type} "${bundle.hash}": ${(err as any).message}`, {
      error: err,
      hash: bundle.hash,
      type: bundle.type,
    })
  }

  return bundle.hash
}

const getListOfSourceBundles = async ({ year: requestedYear, lastModifiedSince: requestedLastModifiedSince }: {
  year?: number,
  lastModifiedSince?: Date | null
}) => {
  let updatedSourceBundles: CrossMgrEventBundle[] = []
  let year = requestedYear || new Date().getFullYear()
  let lastModifiedSince = requestedLastModifiedSince

  if (!requestedLastModifiedSince) lastModifiedSince = await data.get.lastCheckDate(PROVIDER_NAME)

  // 1. If `lastModifiedSince` is requested: fetch only updated files since that time
  // 2. If `year` is requested: fetch all files for that year
  // 3. If neither is specified, but `lastModifiedSince` is not null: fetch only updated files since last check date
  // 4. If neither is specified: fetch all files for the current year
  if (requestedLastModifiedSince || (!requestedYear && lastModifiedSince)) {
    logger.info(`Fetching updated source files since ${lastModifiedSince}`)

    // Fetch event files changed since last check date
    updatedSourceBundles = await fetchEventBundlesForYear(year, { lastModifiedSince })
    console.log({ updatedSourceBundles })
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

      otherEventFiles = otherEventFiles.concat(similarEventFiles.filter(e => e.type === 'event' && e.date === eventFile.date))
    }

    // Consolidate all event files for the same date, organizer & type
    const consolidatedEventFiles = groupEventFiles([...eventFiles, ...otherEventFiles])
    eventFiles = consolidatedEventFiles.filter(e => e.type === 'event')
  }

  await data.update.lastCheckDate(PROVIDER_NAME, new Date(), { events: eventFiles.length, series: seriesFiles.length })

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
  }, {} as CrossMgrEventRawData['payloads'])
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
  }, {} as CrossMgrSerieRawData['payloads'])
}