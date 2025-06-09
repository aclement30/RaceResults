import fs from 'fs'
import _ from 'lodash'
import type { EventSummary } from '../../../src/types/results.ts'
import type { AthleteOverrides, StoredEventSummary } from '../../parsers/athletes/types.ts'
import { s3 as RRS3 } from '../shared/utils.ts'
import defaultLogger from '../shared/logger.ts'
import { CLEAN_DATA_PATH, PARSER_NAME } from './config.ts'
import type { CleanEventResults } from '../shared/types.ts'

const logger = defaultLogger.child({ parser: PARSER_NAME })

export const loadEventResults = async (filename: string): Promise<CleanEventResults> => {
  logger.info(`Importing clean event results for: ${filename}`)

  const fileContent = await RRS3.fetchFile(filename)

  if (!fileContent) throw new Error(`File ${filename} not found!`)

  return JSON.parse(fileContent) as CleanEventResults
}

export const fetchEventResultFilesForYear = async (year: number): Promise<StoredEventSummary[]> => {
  const eventFilename = `events/${year}.json`

  const fileContent = await RRS3.fetchFile(eventFilename)

  if (!fileContent) throw new Error(`File ${eventFilename} not found!`)

  const events = JSON.parse(fileContent) as EventSummary[]

  const sortedEvents = _.sortBy(events, 'date')

  return sortedEvents.map(event => ({
    hash: event.hash,
    year: event.year,
    date: event.date,
    provider: event.provider,
    resultsFile: `${CLEAN_DATA_PATH}${event.provider}/${year}/${event.hash}.json`,
  }))
}

export const loadOverrides = async (): Promise<AthleteOverrides> => {
  const overridesFilename = 'athletes/overrides.json'

  const fileContent = fs.readFileSync('../../storage/' + overridesFilename)

  // const fileContent = await fetchFile(overridesFilename)

  if (!fileContent) throw new Error(`File ${overridesFilename} not found!`)

  return JSON.parse(fileContent as any) as AthleteOverrides
}