import { AwsS3Client } from 'ingestion/shared/aws-s3.ts'
import defaultLogger from 'ingestion/shared/logger.ts'
import type { EventResults, EventSummary } from '../../../src/types/results.ts'
import _ from 'lodash'
import fs from 'fs'
import type { AthleteOverrides, StoredEventSummary } from './types.ts'

import { RR_S3_BUCKET } from 'ingestion/shared/config.ts'

const s3 = new AwsS3Client(RR_S3_BUCKET)

const logger = defaultLogger.child({ provider: 'athletes' })

export const fetchFile = (filename: string) => {
  return s3.fetchFile(filename)
}

export const fetchDirectoryFiles = (directory: string) => {
  return s3.fetchDirectoryFiles(directory)
}

export const writeFile = (path: string, content: string) => {
  return s3.writeFile(path, content)
}

export const deleteFile = (path: string) => {
  return s3.deleteFile(path)
}

export async function loadEventResults(filename: string): Promise<EventResults> {
  logger.info(`Importing event results for: ${filename}`)

  const fileContent = await fetchFile(filename)

  if (!fileContent) throw new Error(`File ${filename} not found!`)

  return JSON.parse(fileContent) as EventResults
}

export const fetchEventResultFilesForYear = async (year: number): Promise<StoredEventSummary[]> => {
  const eventFilename = `events/${year}.json`

  const fileContent = await fetchFile(eventFilename)

  if (!fileContent) throw new Error(`File ${eventFilename} not found!`)

  const events = JSON.parse(fileContent) as EventSummary[]

  const sortedEvents = _.sortBy(events, 'date')

  return sortedEvents.map(event => ({
    hash: event.hash,
    year: event.year,
    date: event.date,
    resultsFile: `events-results/${year}/${event.hash}.json`,
  }))
}

export const loadOverrides = async (): Promise<AthleteOverrides> => {
  const overridesFilename = 'athletes/overrides.json'

  const fileContent = fs.readFileSync('../../storage/' + overridesFilename)

  // const fileContent = await fetchFile(overridesFilename)

  if (!fileContent) throw new Error(`File ${overridesFilename} not found!`)

  return JSON.parse(fileContent as any) as AthleteOverrides
}