import type { AthleteRaceResult, SanctionedEventType, TDiscipline, TGender } from './results'

export type Athlete = {
  uciId: string
  firstName: string
  lastName: string
  gender: TGender
  city?: string
  province?: string
  nationality?: string
  birthYear?: number
  licenses: Record<string, string[]>
  team?: Record<string, { id?: number, name?: string }>
  skillLevel?: { ROAD?: string; CX?: string }
  ageCategory?: { ROAD?: string; CX?: string } // e.g. 'ELITE', 'JUNIOR', 'U13', 'U15', 'U17', 'U19', 'U23', 'MASTER'
  latestUpgrade?: { ROAD?: { date: string, confidence: number }; CX?: { date: string, confidence: number } }
  lastUpdated: string
}

export type AthleteUpgradePoint = {
  date: string
  eventHash: string
  eventName: string
  eventType: SanctionedEventType | null
  discipline: TDiscipline
  position: number
  category: string
  categoryLabel: string
  points: number
  fieldSize: number
  type: 'UPGRADE' | 'SUBJECTIVE'
  partialMatch?: boolean // If true, indicates that the athlete's UCI ID was not an exact match but a close match based on name or other criteria
}

export type AthleteRace = Pick<AthleteRaceResult, 'position' | 'status'> & {
  date: string
  eventHash: string
  eventName: string
  eventType: SanctionedEventType | null
  discipline: TDiscipline
  category: string
  categoryLabel: string
}

export type AthleteProfile = {
  uciId: string
  upgradePoints?: AthleteUpgradePoint[]
  races?: AthleteRace[]
}

export type AthleteCompilations = {
  recentlyUpgradedAthletes: {
    athleteUciId: string,
    skillLevel: string,
    discipline: TDiscipline
    date: string,
  }[]
  pointsCollectors: {
    athleteUciId: string,
    skillLevel: string,
    discipline: TDiscipline,
    points: { UPGRADE: number, SUBJECTIVE: number },
    hasRacedUp: boolean,
  }[]
}