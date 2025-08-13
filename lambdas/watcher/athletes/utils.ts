import { sortBy } from 'lodash-es'
import type { EventSummary } from '../../../src/types/results.ts'
import type {
  AthleteOverrides,
  CleanAthleteCategoryInfo,
  StoredEventSummary
} from './types.ts'
import { s3, s3 as RRS3 } from '../../shared/utils.ts'
import { CLEAN_DATA_BASE_PATH } from './config.ts'
import type { CleanEventResults } from '../../shared/types.ts'
import { PUBLIC_BUCKET_PATHS } from '../../../src/config/s3.ts'
import { CLEAN_ATHLETE_CATEGORIES_FILE } from '../../cbc-membership/config.ts'
import { CONFIG_FILES } from '../../shared/config.ts'

export const loadEventResults = async (filename: string): Promise<CleanEventResults> => {
  const fileContent = await RRS3.fetchFile(filename)

  if (!fileContent) throw new Error(`File ${filename} not found!`)

  return JSON.parse(fileContent) as CleanEventResults
}

export const fetchEventResultFilesForYear = async (year: number): Promise<StoredEventSummary[]> => {
  const eventFilename = `${PUBLIC_BUCKET_PATHS.events}${year}.json`

  const fileContent = await RRS3.fetchFile(eventFilename)

  if (!fileContent) throw new Error(`File ${eventFilename} not found!`)

  const events = JSON.parse(fileContent) as EventSummary[]

  const sortedEvents = sortBy(events, 'date')

  return sortedEvents.map(event => ({
    hash: event.hash,
    year: event.year,
    date: event.date,
    provider: event.provider,
    name: event.name,
    location: event.location,
    sanctionedEventType: event.sanctionedEventType,
    discipline: event.discipline,
    organizerAlias: event.organizerAlias,
    resultsFile: getResultsFilePath(event),
  }))
}

const getResultsFilePath = (eventSummary: Pick<EventSummary, 'hash' | 'year' | 'provider'>): string => {
  let path = `${CLEAN_DATA_BASE_PATH}${eventSummary.provider}/`

  if (eventSummary.provider === 'race-results') path = `${CLEAN_DATA_BASE_PATH}manual-import/`

  path += `${eventSummary.year}/${eventSummary.hash}.json`

  return path
}

export const loadOverrides = async (): Promise<AthleteOverrides> => {
  const fileContent = await s3.fetchFile(CONFIG_FILES.athletesOverrides)

  if (!fileContent) throw new Error(`File ${CONFIG_FILES.athletesOverrides} not found!`)

  return JSON.parse(fileContent as any) as AthleteOverrides
}

export const validateUCIId = (uciId: string): boolean => {
  // UCI ID should be a string of 11 digits
  return !!uciId.match(/^\d{11}$/)
}

export const loadLatestAthleteCategories = async (): Promise<Record<string, CleanAthleteCategoryInfo>> => {
  const fileContent = await s3.fetchFile(CLEAN_ATHLETE_CATEGORIES_FILE)
  if (!fileContent) throw new Error(`Athlete categories file ${CLEAN_ATHLETE_CATEGORIES_FILE} is empty!`)

  return JSON.parse(fileContent) as Record<string, CleanAthleteCategoryInfo>
}

export const findAthleteUciId = (
  params: {
    firstName?: string,
    lastName?: string,
    uciId?: string
  },
  athleteLookupTable: Record<string, string>,
  athleteOverrides: AthleteOverrides
): string | null => {
  const { uciId, firstName, lastName } = params

  if (uciId && validateUCIId(uciId)) return uciId

  const nameKey = `${firstName?.toLowerCase()}|${lastName?.toLowerCase()}`

  // Attempt to find athlete UCI ID by using the lookup table
  if (athleteLookupTable[nameKey]) return athleteLookupTable[nameKey]

  // Check if there is an override for the athlete
  if (athleteOverrides.alternateNames?.[nameKey]) return athleteOverrides.alternateNames[nameKey]

  return null
}