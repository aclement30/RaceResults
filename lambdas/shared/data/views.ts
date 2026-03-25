import { ZodError } from 'zod'
import { AthleteSchema } from '../../../shared/schemas/athletes.ts'
import { PUBLIC_BUCKET_FILES, PUBLIC_BUCKET_PATHS } from '../../../src/config/s3.ts'
import type { Athlete, AthleteProfile, RecentlyUpgradedAthletes } from '../types.ts'
import { s3 as RRS3 } from '../utils.ts'

export async function getViewAthletes(): Promise<Athlete[]>
export async function getViewAthletes(athleteUciId: string): Promise<Athlete>

export async function getViewAthletes(athleteUciId?: string): Promise<Athlete[] | Athlete | null> {
  const fileContent = await RRS3.fetchFile(PUBLIC_BUCKET_FILES.athletes.list, true)

  if (!fileContent) {
    if (athleteUciId) return null
    return []
  }

  const athletes = JSON.parse(fileContent as any) as Athlete[]

  if (athleteUciId) {
    return athletes.find(a => a.uciId === athleteUciId) || null
  }

  return athletes
}

export const updateViewAthletes = async (athletes: Athlete[]): Promise<{
  validationErrors?: Record<string, ZodError>
}> => {
  const existingAthletes = await getViewAthletes()

  const validationErrors: Record<string, ZodError> = {}
  for (const athlete of athletes) {
    try {
      AthleteSchema.parse(athlete)
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

  await RRS3.writeFile(PUBLIC_BUCKET_FILES.athletes.list, JSON.stringify(combinedAthletes))

  if (validationErrors && Object.keys(validationErrors).length > 0) return { validationErrors }

  return {}
}

export const getAthleteProfile = async (athleteUciId: string): Promise<AthleteProfile | null> => {
  const filename = PUBLIC_BUCKET_PATHS.athletesProfiles + `${athleteUciId}.json`

  const fileContent = await RRS3.fetchFile(filename, true)

  if (!fileContent) return null

  return JSON.parse(fileContent) as AthleteProfile
}

export const updateAthleteProfile = async (athleteProfile: AthleteProfile): Promise<void> => {
  const { uciId: athleteUciId } = athleteProfile

  const filename = PUBLIC_BUCKET_PATHS.athletesProfiles + `${athleteUciId}.json`

  await RRS3.writeFile(filename, JSON.stringify(athleteProfile))
}

export const updateViewRecentlyUpgradedAthletes = async (athletes: RecentlyUpgradedAthletes): Promise<void> => {
  await RRS3.writeFile(PUBLIC_BUCKET_FILES.views.recentlyUpgradedAthletes, JSON.stringify(athletes))
}