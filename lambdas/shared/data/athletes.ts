import { s3 as RRS3 } from '../utils.ts'
import {
  ATHLETE_MANUAL_EDITS_FILE,
  BASE_ATHLETES_FILE,
  CLEAN_ATHLETE_RACES_RESULTS_PATH,
  CLEAN_ATHLETE_UPGRADE_DATES_FILE,
  CLEAN_ATHLETE_UPGRADE_POINTS_PATH,
  DUPLICATE_ATHLETES_FILE
} from '../../processing/config.ts'
import { PUBLIC_BUCKET_FILES, PUBLIC_BUCKET_PATHS } from '../../../src/config/s3.ts'
import type { AthleteOverrides, CleanAthleteRaceResult } from '../../processing/types.ts'
import { CLEAN_ATHLETE_CATEGORIES_FILE, CONFIG_FILES } from '../config.ts'
import type {
  Athlete, AthleteManualEdit,
  AthleteProfile,
  AthleteSkillCategory,
  AthleteUpgradeDate,
  BaseAthleteUpgradePoint
} from '../types.ts'

export const getBaseAthletes = async (): Promise<Athlete[]> => {
  const fileContent = await RRS3.fetchFile(BASE_ATHLETES_FILE, true)

  if (!fileContent) return []

  return JSON.parse(fileContent as any) as Athlete[]
}

export const updateBaseAthletes = async (athletes: Athlete[]): Promise<void> => {
  const existingAthletes = await getBaseAthletes()

  const updatedAthleteUciIds = athletes.map(a => a.uciId)
  const combinedAthletes = [
    ...existingAthletes.filter(a => !updatedAthleteUciIds.includes(a.uciId)),
    ...athletes
  ]

  await RRS3.writeFile(BASE_ATHLETES_FILE, JSON.stringify(combinedAthletes))
}

export const getAthleteManualEdits = async (): Promise<AthleteManualEdit[]> => {
  const fileContent = await RRS3.fetchFile(ATHLETE_MANUAL_EDITS_FILE, true)

  if (!fileContent) return []

  return JSON.parse(fileContent as any) as AthleteManualEdit[]
}

export const updateAthleteManualEdits = async (athleteEdits: AthleteManualEdit[]): Promise<void> => {
  const existingAthleteManualEdits = await getAthleteManualEdits()

  const updatedAthleteUciIds = existingAthleteManualEdits.map(a => a.uciId)
  const combinedAthleteManualEdits = [
    ...existingAthleteManualEdits.filter(a => !updatedAthleteUciIds.includes(a.uciId)),
    ...athleteEdits.map(athleteManualEdit => {
      const existingEdit = existingAthleteManualEdits.find(e => e.uciId === athleteManualEdit.uciId)
      return {
        athleteManualEdit,
        meta: {
          createdAt: existingEdit ? existingEdit.meta.createdAt : new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      }
    })
  ]

  await RRS3.writeFile(ATHLETE_MANUAL_EDITS_FILE, JSON.stringify(combinedAthleteManualEdits))
}

export const getAthletesOverrides = async (): Promise<AthleteOverrides> => {
  const fileContent = await RRS3.fetchFile(CONFIG_FILES.athletesOverrides)

  if (!fileContent) throw new Error(`File ${CONFIG_FILES.athletesOverrides} not found!`)

  return JSON.parse(fileContent as any) as AthleteOverrides
}

export const getAthletesCategories = async (): Promise<AthleteSkillCategory[]> => {
  const fileContent = await RRS3.fetchFile(CLEAN_ATHLETE_CATEGORIES_FILE)

  if (!fileContent) throw new Error(`Athlete categories file ${CLEAN_ATHLETE_CATEGORIES_FILE} is empty!`)

  return JSON.parse(fileContent) as AthleteSkillCategory[]
}

export const updateAthleteCategories = async (athleteCategories: AthleteSkillCategory[]): Promise<void> => {
  await RRS3.writeFile(CLEAN_ATHLETE_CATEGORIES_FILE, JSON.stringify(athleteCategories))
}

export const getAthletesRacesResults = async ({ year, eventHash, eventHashes }: {
  year: number,
  eventHash?: string
  eventHashes?: string[]
}): Promise<CleanAthleteRaceResult[]> => {
  if (eventHash) eventHashes = [eventHash]

  if (!eventHashes || eventHashes.length === 0) throw new Error('You must provide at least an event hash to get athletes race results!')

  const raceResultsByEvents: CleanAthleteRaceResult[][] = await Promise.all(
    eventHashes.map(async (hash) => {
      const filename = CLEAN_ATHLETE_RACES_RESULTS_PATH + `${year}/${hash}.json`

      const fileContent = await RRS3.fetchFile(filename, true)

      if (!fileContent) return []

      return JSON.parse(fileContent) as CleanAthleteRaceResult[]
    })
  )

  return raceResultsByEvents.flat()
}

export const updateAthletesRacesResults = async (
  athletesRaceResults: CleanAthleteRaceResult[],
  { year, eventHash }: { year: number, eventHash: string }
): Promise<void> => {
  const filename = CLEAN_ATHLETE_RACES_RESULTS_PATH + `${year}/${eventHash}.json`

  await RRS3.writeFile(filename, JSON.stringify(athletesRaceResults))
}

export const getAthletesUpgradePoints = async ({ year, eventHash, eventHashes }: {
  year: number,
  eventHash?: string
  eventHashes?: string[]
}): Promise<BaseAthleteUpgradePoint[]> => {
  if (eventHash) eventHashes = [eventHash]

  if (!eventHashes || eventHashes.length === 0) throw new Error('You must provide at least an event hash to get athletes upgrade points!')

  const upgradePointsByEvents: BaseAthleteUpgradePoint[][] = await Promise.all(
    eventHashes.map(async (hash) => {
      const filename = CLEAN_ATHLETE_UPGRADE_POINTS_PATH + `${year}/${hash}.json`

      const fileContent = await RRS3.fetchFile(filename, true)

      if (!fileContent) return []

      return JSON.parse(fileContent) as BaseAthleteUpgradePoint[]
    })
  )

  return upgradePointsByEvents.flat()
}

export const updateAthletesUpgradePoints = async (
  athletesUpgradePoints: BaseAthleteUpgradePoint[],
  { year, eventHash }: { year: number, eventHash: string }
): Promise<void> => {
  const filename = CLEAN_ATHLETE_UPGRADE_POINTS_PATH + `${year}/${eventHash}.json`

  await RRS3.writeFile(filename, JSON.stringify(athletesUpgradePoints))
}

export const getAthletesUpgradeDates = async (): Promise<AthleteUpgradeDate[]> => {
  const fileContent = await RRS3.fetchFile(CLEAN_ATHLETE_UPGRADE_DATES_FILE, true)

  if (!fileContent) return []

  return JSON.parse(fileContent) as AthleteUpgradeDate[]
}

export const getAthletesLookup = async (): Promise<Record<string, string>> => {
  const fileContent = await RRS3.fetchFile(PUBLIC_BUCKET_FILES.athletes.lookup, true)

  if (!fileContent) return {}

  return JSON.parse(fileContent) as Record<string, string>
}

export const updateAthletesLookup = async (
  athletesLookupTable: Record<string, string>,
  duplicates: Record<string, string[]>
): Promise<void> => {
  await RRS3.writeFile(PUBLIC_BUCKET_FILES.athletes.lookup, JSON.stringify(athletesLookupTable))
  await RRS3.writeFile(DUPLICATE_ATHLETES_FILE, JSON.stringify(duplicates))
}

