import { s3 as RRS3 } from '../utils.ts'
import {
  ATHLETE_MANUAL_EDITS_FILE,
  BASE_ATHLETES_FILE,
  CLEAN_ATHLETE_RACES_RESULTS_PATH,
  CLEAN_ATHLETE_UPGRADE_DATES_FILE,
  CLEAN_ATHLETE_UPGRADE_POINTS_PATH,
  DUPLICATE_ATHLETES_FILE
} from '../../processing/config.ts'
import { PUBLIC_BUCKET_FILES } from '../../../src/config/s3.ts'
import type { AthleteOverrides, CleanAthleteRaceResult } from '../../processing/types.ts'
import { CLEAN_ATHLETE_CATEGORIES_FILE, CONFIG_FILES } from '../config.ts'
import type {
  AthleteManualEdit,
  AthleteSkillCategory,
  AthleteUpgradeDate,
  BaseAthleteUpgradePoint
} from '../types.ts'
import {
  AthleteManualEditSchema,
  BaseAthleteSchema,
} from '../../../shared/schemas/athletes.ts'
import { ZodError } from 'zod'
import type { BaseAthlete, UpdateAthleteManualEdit } from '../../../shared/types/athletes.ts'

export async function getBaseAthletes(athleteUciId: string): Promise<BaseAthlete | null>
export async function getBaseAthletes(): Promise<BaseAthlete[]>

export async function getBaseAthletes(athleteUciId?: string): Promise<BaseAthlete | null | BaseAthlete[]> {
  const fileContent = await RRS3.fetchFile(BASE_ATHLETES_FILE, true)

  if (!fileContent) {
    if (athleteUciId) return null
    return []
  }

  const athletes = JSON.parse(fileContent as any) as BaseAthlete[]

  if (athleteUciId) {
    return athletes.find(a => a.uciId === athleteUciId) || null
  }

  return athletes
}

export const updateBaseAthletes = async (athletes: BaseAthlete[]): Promise<{
  validationErrors?: Record<string, ZodError>
}> => {
  const existingAthletes = await getBaseAthletes()

  const validationErrors: Record<string, ZodError> = {}

  for (const athlete of athletes) {
    try {
      BaseAthleteSchema.parse(athlete)
    } catch (error) {
      validationErrors[athlete.uciId] = error as ZodError
    }
  }

  const updatedAthleteUciIds = athletes.map(a => a.uciId).filter(a => !validationErrors[a])
  const validAthletes = athletes.filter(a => !validationErrors[a.uciId])

  const combinedAthletes = [
    ...existingAthletes.filter(a => !updatedAthleteUciIds.includes(a.uciId)),
    ...validAthletes
  ]

  await RRS3.writeFile(BASE_ATHLETES_FILE, JSON.stringify(combinedAthletes))

  if (validationErrors && Object.keys(validationErrors).length > 0) return { validationErrors }

  return {}
}

export async function getAthleteManualEdits(athleteUciId: string): Promise<AthleteManualEdit | null>
export async function getAthleteManualEdits(): Promise<AthleteManualEdit[]>

export async function getAthleteManualEdits(athleteUciId?: string): Promise<AthleteManualEdit | null | AthleteManualEdit[]> {
  const fileContent = await RRS3.fetchFile(ATHLETE_MANUAL_EDITS_FILE, true)

  if (!fileContent) {
    if (athleteUciId) return null
    return []
  }

  const manualEdits = JSON.parse(fileContent as any) as AthleteManualEdit[]

  if (athleteUciId) {
    return manualEdits.find(a => a.uciId === athleteUciId) || null
  }

  return manualEdits
}

export const updateAthleteManualEdit = async (athleteManualEdit: UpdateAthleteManualEdit): Promise<void> => {
  const existingAthleteManualEdits = await getAthleteManualEdits()
  const existingEdit = existingAthleteManualEdits.find(e => e.uciId === athleteManualEdit.uciId)

  const updatedAthleteManualEdit: AthleteManualEdit = {
    ...athleteManualEdit,
    meta: {
      createdAt: existingEdit ? existingEdit.meta.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  }

  AthleteManualEditSchema.parse(updatedAthleteManualEdit)

  const combinedAthleteManualEdits = [
    ...existingAthleteManualEdits.filter(a => a.uciId !== athleteManualEdit.uciId),
    updatedAthleteManualEdit,
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

