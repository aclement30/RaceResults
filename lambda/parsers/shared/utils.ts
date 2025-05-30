import fs from 'fs'
import shortHash from 'short-hash'
import type {
  BaseCategory,
  EventResults,
  EventSummary,
  SerieResults,
  SerieSummary
} from '../../../src/types/results.ts'
import { AwsS3Client, RR_S3_BUCKET } from './aws-s3.ts'
import logger from './logger.ts'

const DEBUG = false
const LOCAL_STORAGE_PATH = '../../storage'

const s3 = new AwsS3Client(RR_S3_BUCKET)

export function validateYear(year: string | number) {
  if (isNaN(+year)) return false

  return +year >= 2020 && +year <= new Date().getFullYear()
}

export function createEventSerieHash(inputData: {
  year: number,
  organizer: string,
  type: 'series' | 'event' | 'doc' | 'startlist',
  date?: string | null
}): string {
  return shortHash(`${inputData.year}/${inputData.organizer}/${inputData.type}/${inputData.date}`)
}

export function getBaseCategories(combinedCategories: Record<string, BaseCategory>): BaseCategory[] {
  return Object.values(combinedCategories)
    .map((cat: BaseCategory) => ( {
      alias: cat.alias,
      label: cat.label,
      gender: cat.gender,
    } ))
    .sort(sortByCategory)
}

export function sortByCategory(a: { label: string }, b: { label: string }): number {
  if (!a.label.toLowerCase().startsWith('elite') && b.label.toLowerCase().startsWith('elite'))
    return 1
  if (a.label.toLowerCase().startsWith('elite') && !b.label.toLowerCase().startsWith('elite'))
    return -1
  return a.label < b.label ? -1 : 1
}

export const formatCategoryAlias = (catName: string): string => {
  const alias = catName.toLowerCase().replace('(m)', 'm').replace('(w)', 'w').replace('(open)', 'x').replace(/[\s\/]/g, '-').replace(/\+/g, '').trim()

  return alias
}

export async function getLastCheckDate(provider: string): Promise<Date | null> {
  const { files } = await s3.fetchDirectoryFiles('watchers/last-check/')

  const lastProviderCheckDate = files!.find(f => f.Key!.endsWith(`${provider}.json`))?.LastModified

  return lastProviderCheckDate || null
}

export async function setLastCheck(provider: string, timestamp: Date, extra?: Record<string, any>) {
  const payload = {
    timestamp: timestamp.toISOString(),
    ...( extra || {} )
  }

  await s3.writeFile(`watchers/last-check/${provider}.json`, JSON.stringify(payload))
}

export async function getEventDays(): Promise<Record<string, 'day' | 'evening'>> {
  const currentYear = new Date().getFullYear()

  const eventDaysJson = await s3.fetchFile('watchers/event-days.json')

  if (!eventDaysJson) throw new Error('Event days file could not be found!')

  const allEventDays = JSON.parse(eventDaysJson)
  return allEventDays[currentYear] || {}
}

export async function writeEventsOrSeries(events: Record<string, Array<EventSummary | SerieSummary>>, type: 'events' | 'series') {
  for (const year of Object.keys(events)) {
    const yearEvents = events[year]
    const filePath = `${type}/${year}.json`

    logger.info(`Writing ${yearEvents.length} ${type} for ${year}`)

    // Download current events list
    let updatedEvents: Array<EventSummary | SerieSummary> = await s3.fetchFile(filePath).then((fileContent) => {
      if (!fileContent?.length) return []

      return JSON.parse(fileContent)
    })

    logger.info(`${updatedEvents.length} existing ${type} found in ${filePath}`)

    for (const event of yearEvents) {
      if (updatedEvents.find(e => e.hash === event.hash)) {
        // Replace existing event
        updatedEvents = updatedEvents.filter(e => e.hash !== event.hash).concat([event])
        logger.info(`Updating ${type.slice(0, -1)} ${event.hash}`)
      } else {
        updatedEvents.push(event)
        logger.info(`Adding ${type.slice(0, -1)} ${event.hash}`)
      }
    }

    logger.info(`Uploading ${updatedEvents.length} ${type} to ${filePath}`)
    await s3.writeFile(filePath, JSON.stringify(updatedEvents))

    if (DEBUG) fs.writeFileSync(`${LOCAL_STORAGE_PATH}/${filePath}`, JSON.stringify(updatedEvents, null, 2))
  }
}

export async function writeResults(results: Record<string, Record<string, EventResults | SerieResults>> = {}, type: 'events' | 'series') {
  for (const year of Object.keys(results)) {
    const yearResults = results[year]

    logger.info(`Writing ${Object.keys(yearResults).length} ${type} results for ${year}`)

    for (const resultHash of Object.keys(yearResults)) {
      const result = yearResults[resultHash]
      const filePath = `${type}-results/${year}/${resultHash}.json`

      logger.info(`Uploading ${type} results for ${resultHash} to ${filePath}`)
      await s3.writeFile(filePath, JSON.stringify(result))

      if (DEBUG) fs.writeFileSync(`${LOCAL_STORAGE_PATH}/${filePath}`, JSON.stringify(result, null, 2))
    }
  }
}