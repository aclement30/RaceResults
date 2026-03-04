import { S3ServiceException } from '@aws-sdk/client-s3'
import { keyBy } from 'lodash-es'
import defaultLogger from '../../../shared/logger.ts'
import { createEventSerieHash, s3 as RRS3 } from '../../../shared/utils.ts'
import { PROVIDER_NAME, RAW_MANUAL_IMPORT_DATA_PATH } from '../config.ts'
import { validateRefFile } from '../utils.ts'
import type { ManualImportBaseFile, ManualImportEventFile, ManualImportSerieFile } from '../types.ts'
import { parseRawEvent } from './parsers/default/event-parser.ts'
import { parseRawSerie } from './parsers/default/serie-parser.ts'
import {
  type ManualImportRaceResultsEventFile,
  parseRawEvent as raceResultsEventParser
} from './parsers/race-results/event-parser.ts'
import { TeamParser } from '../../../shared/team-parser.ts'
import data from '../../../shared/data.ts'
import type { RaceEvent, SerieSummary } from '../../../../src/types/results.ts'
import type { AthleteManualEdit } from '../../../shared/types.ts'

const logger = defaultLogger.child({ provider: PROVIDER_NAME })

export default async (importRefFiles: string[]): Promise<{ hashes: string[], year: number }> => {
  await TeamParser.init()

  const athleteManualEdits = await data.get.athleteManualEdits()
  const athleteManualEditsByUciId: Record<string, AthleteManualEdit> = keyBy(athleteManualEdits, 'athleteUciId')

  const promises = await Promise.allSettled(importRefFiles.map(async (filePath) => {
    let bundle
    let payloads

    try {
      ;({ payloads, ...bundle } = await fetchManualImportFiles(filePath))
    } catch (err) {
      logger.error(`Failed to fetch raw ingestion data from ${filePath}: ${(err as any).message}`, {
        error: err,
        filePath,
      })

      throw new Error(`Failed to fetch raw ingestion data from ${filePath}: ${(err as any).message}`)
    }

    const { type } = bundle
    if (type === 'event') {
      const event = await cleanEvent(bundle, payloads, bundle.year, athleteManualEditsByUciId)
      return { event }
    } else if (type === 'serie') {
      const serie = await cleanSerie(bundle, payloads, bundle.year, athleteManualEditsByUciId)
      return { serie }
    } else {
      throw new Error(`Unsupported reference file type: ${(bundle as ManualImportBaseFile).type}`)
    }
  }))

  const allEvents: RaceEvent[] = []
  const allSeries: SerieSummary[] = []
  const cleanHashes: string[] = []
  let requestYear

  promises.forEach((promise, i) => {
    if (promise.status === 'rejected') {
      logger.error(`Failed to parse raw data: ${promise.reason}`, {
        error: promise.reason,
        file: importRefFiles[i],
      })
    } else {
      if (promise.value.event) {
        const { event } = promise.value
        allEvents.push(event)
        cleanHashes.push(event.hash)
        requestYear = event.year
      } else if (promise.value.serie) {
        const { serie } = promise.value
        allSeries.push(serie)
        cleanHashes.push(serie.hash)
        requestYear = serie.year
      }
    }
  })

  try {
    logger.info(`Saving ${allEvents.length} events for year ${requestYear}...`)

    await data.update.events(allEvents, { year: requestYear! })
  } catch (err) {
    logger.error(`Failed to save event data: ${(err as any).message}`, {
      error: err,
    })
  }

  try {
    logger.info(`Saving ${allSeries.length} series for ${requestYear}...`)

    await data.update.series(allSeries, { year: requestYear! })
  } catch (err) {
    logger.error(`Failed to save serie data: ${(err as any).message}`, {
      error: err,
    })
  }

  return {
    hashes: cleanHashes,
    year: requestYear!,
  }
}

const cleanEvent = async (
  bundle: ManualImportRaceResultsEventFile | ManualImportEventFile,
  payloads: Record<string, string>,
  year: number,
  athleteManualEdits: Record<string, AthleteManualEdit>
) => {
  let event
  let eventResults

  if (bundle.provider) {
    switch (bundle.provider) {
      case 'race-results':
        ;({ event, eventResults } = raceResultsEventParser(bundle as ManualImportRaceResultsEventFile, payloads))
        break
      default:
        throw new Error(`Unsupported provider "${bundle.provider}" for manual import.`)
    }
  }

  ;({ event, eventResults } = parseRawEvent(bundle as ManualImportEventFile, payloads, athleteManualEdits))

  await data.update.eventResults(eventResults, { eventHash: event.hash, year })

  return event
}

const cleanSerie = async (
  bundle: ManualImportSerieFile,
  payloads: Record<string, string>,
  year: number,
  athleteManualEdits: Record<string, AthleteManualEdit>
) => {
  const {
    serie,
    serieResults
  } = parseRawSerie(bundle, payloads, athleteManualEdits)
  
  await data.update.serieResults(serieResults, { eventHash: serieResults.hash, year })

  return serie
}

// Fetch reference file and linked payloads files
const fetchManualImportFiles = async (refFilePath: string): Promise<ManualImportBaseFile & {
  payloads: Record<string, string>
}> => {
  const pathParts = refFilePath.split('/')
  const year = +pathParts[pathParts.length - 2]
  const basename = refFilePath.split('/').pop()!
  const directory = basename.replace('.json', '')
  const { files } = await RRS3.fetchDirectoryFiles(`${RAW_MANUAL_IMPORT_DATA_PATH}${year}/${directory}/`)

  const sourceFiles = files?.map(file => file.Key!) || []

  logger.info(`Importing raw data from: ${directory}`)

  let bundle: ManualImportBaseFile
  const payloads: Record<string, string> = {}

  try {
    const refFileContent: ManualImportBaseFile = await RRS3.fetchFile(refFilePath).then(content => JSON.parse(content!))

    logger.info(`Validating reference file: ${refFilePath}`)
    validateRefFile(refFileContent)

    bundle = {
      ...refFileContent,
      hash: createEventSerieHash(refFileContent as ManualImportEventFile),
      files: sourceFiles,
    }
  } catch (error) {
    if (error instanceof S3ServiceException && error.name === 'NoSuchKey') {
      throw new Error(`Reference file ${refFilePath} could not be found in S3 bucket`)
    }

    throw new Error(`Invalid reference file ${refFilePath}: ${(error as Error).message}`)
  }

  logger.info(`Listing data files for: ${directory}`)

  for (const filename of sourceFiles) {
    const fileContent = await RRS3.fetchFile(filename)

    if (!fileContent) throw new Error(`File ${filename} not found!`)

    const basename = filename!.split('/').pop()!
    payloads[basename] = fileContent
  }

  return {
    ...bundle,
    payloads,
  }
}