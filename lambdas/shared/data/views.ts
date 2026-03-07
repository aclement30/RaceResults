import type { Athlete, AthleteProfile, RecentlyUpgradedAthletes } from '../../../src/types/athletes.ts'
import { s3 as RRS3 } from '../utils.ts'
import { PUBLIC_BUCKET_FILES, PUBLIC_BUCKET_PATHS } from '../../../src/config/s3.ts'

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

export const updateViewAthletes = async (athletes: Athlete[]): Promise<void> => {
  const existingAthletes = await getViewAthletes()

  const updatedAthleteUciIds = athletes.map(a => a.uciId)
  const combinedAthletes = [
    ...existingAthletes.filter(a => !updatedAthleteUciIds.includes(a.uciId)),
    ...athletes
  ]

  await RRS3.writeFile(PUBLIC_BUCKET_FILES.athletes.list, JSON.stringify(combinedAthletes))
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