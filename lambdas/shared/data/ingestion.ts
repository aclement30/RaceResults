import { CONFIG_FILES, RAW_INGESTION_DATA_PATH, WATCHER_LAST_CHECKS_PATH } from '../config.ts'
import { s3 as RRS3 } from '../utils.ts'
import type {
  RawAthlete,
  RawAthleteEventUpgradePoint,
  RawAthleteRaceResult,
  RawAthleteTeam
} from '../../processing/types.ts'
import {
  PROCESSING_RAW_DATA_ATHLETES_PATH,
  PROCESSING_RAW_DATA_RACE_RESULTS_PATH,
  PROCESSING_RAW_DATA_TEAMS_PATH,
  PROCESSING_RAW_DATA_UPGRADE_POINTS_PATH
} from '../../processing/config.ts'

export const getRawIngestionData = async <T>(provider: string, eventHash: string, year: number): Promise<T> => {
  const filename = RAW_INGESTION_DATA_PATH + `${provider}/${year}/${eventHash}.json`

  const fileContent = await RRS3.fetchFile(filename)

  if (!fileContent) return {} as T

  return JSON.parse(fileContent) as T
}

export const updateRawIngestionData = async <T>(
  rawData: T,
  { provider, year, eventHash }: { provider: string, year: number, eventHash: string }
): Promise<void> => {
  const filename = RAW_INGESTION_DATA_PATH + `${provider}/${year}/${eventHash}.json`

  await RRS3.writeFile(filename, JSON.stringify(rawData))
}

export const getLastCheckDate = async (provider: string): Promise<Date | null> => {
  const { files } = await RRS3.fetchDirectoryFiles(WATCHER_LAST_CHECKS_PATH)

  const lastProviderCheckDate = files!.find(f => f.Key!.endsWith(`${provider}.json`))?.LastModified

  return lastProviderCheckDate || null
}

export const updateLastCheckDate = async (
  provider: string,
  timestamp: Date,
  extra?: Record<string, any>
): Promise<void> => {
  const payload = {
    watcher: provider,
    timestamp: timestamp.toISOString(),
    ...(extra || {})
  }

  await RRS3.writeFile(`${WATCHER_LAST_CHECKS_PATH}${provider}.json`, JSON.stringify(payload))
}

export const getEventDays = async (): Promise<Record<string, 'day' | 'evening'>> => {
  const currentYear = new Date().getFullYear()

  const eventDaysJson = await RRS3.fetchFile(CONFIG_FILES.eventDays)

  if (!eventDaysJson) throw new Error('Event days file could not be found!')

  const allEventDays = JSON.parse(eventDaysJson)
  return allEventDays[currentYear] || {}
}

export const getRawEventAthletes = async (eventHash: string, year: number): Promise<RawAthlete[]> => {
  const filename = PROCESSING_RAW_DATA_ATHLETES_PATH + `${year}/${eventHash}.json`

  const fileContent = await RRS3.fetchFile(filename, true)

  if (!fileContent) return []

  return JSON.parse(fileContent) as RawAthlete[]
}

export const updateRawEventAthletes = async (
  eventAthletes: RawAthlete[],
  { year, eventHash }: { year: number, eventHash: string }
): Promise<void> => {
  const filename = PROCESSING_RAW_DATA_ATHLETES_PATH + `${year}/${eventHash}.json`

  await RRS3.writeFile(filename, JSON.stringify(eventAthletes))
}

export const getRawAthletesRaceResults = async (eventHash: string, year: number): Promise<RawAthleteRaceResult[]> => {
  const filename = PROCESSING_RAW_DATA_RACE_RESULTS_PATH + `${year}/${eventHash}.json`

  const fileContent = await RRS3.fetchFile(filename, true)

  if (!fileContent) return []

  return JSON.parse(fileContent) as RawAthleteRaceResult[]
}

export const updateRawAthletesRaceResults = async (
  raceAthleteRaceResults: RawAthleteRaceResult[],
  { year, eventHash }: { year: number, eventHash: string }
): Promise<void> => {
  const filename = PROCESSING_RAW_DATA_RACE_RESULTS_PATH + `${year}/${eventHash}.json`

  await RRS3.writeFile(filename, JSON.stringify(raceAthleteRaceResults))
}

export const getRawAthletesUpgradePoints = async (
  eventHash: string,
  year: number
): Promise<RawAthleteEventUpgradePoint[]> => {
  const filename = PROCESSING_RAW_DATA_UPGRADE_POINTS_PATH + `${year}/${eventHash}.json`

  const fileContent = await RRS3.fetchFile(filename, true)

  if (!fileContent) return []

  return JSON.parse(fileContent) as RawAthleteEventUpgradePoint[]
}

export const updateRawAthletesUpgradePoints = async (
  athleteUpgradePoints: RawAthleteEventUpgradePoint[],
  { year, eventHash }: { year: number, eventHash: string }
): Promise<void> => {
  const filename = PROCESSING_RAW_DATA_UPGRADE_POINTS_PATH + `${year}/${eventHash}.json`

  await RRS3.writeFile(filename, JSON.stringify(athleteUpgradePoints))
}

export const getRawAthletesTeams = async (
  year: number
): Promise<Record<string, RawAthleteTeam>> => {
  const filename = PROCESSING_RAW_DATA_TEAMS_PATH + `${year}.json`

  const fileContent = await RRS3.fetchFile(filename, true)

  if (!fileContent) return {}

  return JSON.parse(fileContent) as Record<string, RawAthleteTeam>
}

export const updateRawAthletesTeams = async (
  athletesTeams: Record<string, RawAthleteTeam>,
  { year }: { year: number }
): Promise<void> => {
  const filename = PROCESSING_RAW_DATA_TEAMS_PATH + `${year}.json`

  await RRS3.writeFile(filename, JSON.stringify(athletesTeams))
}