import { S3ServiceException } from '@aws-sdk/client-s3'
import defaultLogger from '../../../shared/logger.ts'
import { createEventSerieHash, s3 as RRS3 } from '../../../shared/utils.ts'
import { CLEAN_DATA_PATH, PROVIDER_NAME, RAW_DATA_PATH } from '../config.ts'
import { validateRefFile } from '../utils.ts'
import type { ManualImportBaseFile, ManualImportEventFile, ManualImportSerieFile } from '../types.ts'
import { parseEvent } from './parsers/default/event-parser.ts'
import { parseSerie } from './parsers/default/serie-parser.ts'
import {
  type ManualImportRaceResultsEventFile,
  parseEvent as raceResultsEventParser
} from './parsers/race-results/event-parser.ts'
import { TeamParser } from '../../../shared/team-parser.ts'
import { loadOverrides } from '../../athletes/utils.ts'

const logger = defaultLogger.child({ provider: PROVIDER_NAME })

export default async (importRefFiles: string[]): Promise<{ hashes: string[], year: number }> => {
  await TeamParser.init()
  const athletesOverrides = await loadOverrides()

  const cleanData = await Promise.allSettled(importRefFiles.map(async (filePath) => {
    const { payloads, ...bundle } = await fetchManualImportFiles(filePath)

    if (bundle.type === 'event') {
      if (bundle.provider) {
        switch (bundle.provider) {
          case 'race-results':
            return raceResultsEventParser(bundle as ManualImportRaceResultsEventFile, payloads)
            break
          default:
            logger.error(`Unsupported provider "${bundle.provider}" for manual import.`)
            return
        }
      }

      return parseEvent(bundle as ManualImportEventFile, payloads, athletesOverrides)
    } else if (bundle.type === 'serie') {
      if (bundle.provider) {
        switch (bundle.provider) {
          // case 'race-results':
          //   return raceResultsEventParser(bundle as ManualImportRaceResultsEventFile, payloads)
          //   break
          default:
            logger.error(`Unsupported provider "${bundle.provider}" for manual import.`)
            return
        }
      }

      return parseSerie(bundle as ManualImportSerieFile, payloads, athletesOverrides)
    } else {
      throw new Error(`Unsupported reference file type: ${(bundle as ManualImportBaseFile).type}`)
    }
  }))

  const cleanHashes: string[] = []
  let requestYear

  // Write clean data to S3 bucket
  for (const [index, importResult] of cleanData.entries()) {
    if (importResult.status === 'rejected') {
      logger.error(`Failed to parse raw data: ${importResult.reason}`, {
        file: importRefFiles[index],
        error: importResult.reason
      })
      continue
    }

    const { hash, type, year } = importResult.value!
    requestYear = year
    cleanHashes.push(hash)

    const filePath = `${CLEAN_DATA_PATH}${year}/${hash}.json`

    try {
      logger.info(`Uploading ${type} ${hash} clean data to ${filePath}`, { hash })
      await RRS3.writeFile(filePath, JSON.stringify(importResult.value))
    } catch (err) {
      logger.error(`Failed to upload clean data for ${hash}: ${(err as any).message}`, { error: err, hash })
    }
  }

  return {
    hashes: cleanHashes,
    year: requestYear!,
  }
}

// Fetch reference file and linked payloads files
const fetchManualImportFiles = async (refFilePath: string): Promise<ManualImportBaseFile & {
  payloads: Record<string, string>
}> => {
  const pathParts = refFilePath.split('/')
  const year = +pathParts[pathParts.length - 2]
  const basename = refFilePath.split('/').pop()!
  const directory = basename.replace('.json', '')
  const { files } = await RRS3.fetchDirectoryFiles(`${RAW_DATA_PATH}${year}/${directory}/`)

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