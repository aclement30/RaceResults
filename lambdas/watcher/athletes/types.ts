import type { Athlete, AthleteRace, AthleteUpgradePoint } from '../../../src/types/athletes.ts'
import type { EventSummary } from '../../../src/types/results.ts'
import type { CleanEventAthlete } from '../../shared/types.ts'

export type StoredEventSummary =
  Pick<EventSummary, 'hash' | 'year' | 'date' | 'sanctionedEventType' | 'name' | 'discipline' | 'organizerAlias' | 'location'>
  & {
  resultsFile: string
}

export type AthleteOverrides = {
  replacedUciIds?: Record<string, { old: string, new: string, name: string }>
  levelUpgradeDates?: Record<string, { level: string, date: string, discipline: 'ROAD' | 'CX' }[]>
  // Athlete data overrides by UCI ID
  // Eg. { 'key': value }
  athleteData?: Record<string, Record<string, string>>
  // Alternate names for athletes (firstName|lastName: uciId)
  alternateNames?: Record<string, string>
  ignoredTeams?: string[]
}

export type CleanAthlete = Athlete

export type CleanAthleteEventUpgradePoint = AthleteUpgradePoint & {
  athleteUciId?: string
  firstName?: string
  lastName?: string
}

// Store upgrade points for athletes by athlete UCI ID
export type CleanAthleteEventUpgradePoints = Record<string, CleanAthleteEventUpgradePoint[]>

export type CleanAthleteRace = AthleteRace & {
  athleteUciId?: string
  firstName?: string
  lastName?: string
  teamName?: string
}

export type CleanAthleteEventRaces = Record<string, CleanAthleteRace[]>

export type CleanAthleteUpgradeDate = Record<string, { date: string, confidence: number }>

export type CleanAthleteTeam = Record<string, { id?: number, name?: string }>

export type CleanAthleteCategoryInfo = {
  uciId: string
  skillLevels: { ROAD?: Record<string, string>, CX?: Record<string, string> }
  ageCategory: string | null
}

export type ExtractedEventAthlete =
  Omit<CleanEventAthlete, 'bibNumber' | 'firstName' | 'lastName' | 'gender' | 'team' | 'eventCategories'>
  & Pick<Athlete, 'firstName' | 'lastName' | 'licenses' | 'lastUpdated'>
  & Partial<Pick<Athlete, 'gender'>>
  & {
  uciId: string
  birthYear?: number
}
