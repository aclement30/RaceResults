import type { Athlete } from '../../src/types/athletes.ts'
import type { RaceEvent, TDiscipline } from '../../src/types/results.ts'

export type {
  Athlete,
  AthleteProfile,
  BaseAthleteUpgradePoint
} from '../../src/types/athletes.ts'

export type {
  AthleteRaceResult,
  BaseCategory,
  EventAthlete,
  EventCategory,
  EventResults,
  RaceEvent,
  SanctionedEventType,
  SerieResults,
  SerieSummary,
  UpgradePointResult,
} from '../../src/types/results.ts'

export type {
  Team
} from '../../src/types/team.ts'

export type AthleteSkillCategory = {
  athleteUciId: string
  skillLevels: { ROAD?: Record<string, string>, CX?: Record<string, string> }
  ageCategory: string | null
}

export type AthleteTeam = {
  athleteUciId: string
  year: number
  teamId?: number
  teamName: string
}

export type EventSummary =
  Pick<RaceEvent, 'hash' | 'year' | 'date' | 'sanctionedEventType' | 'name' | 'discipline' | 'organizerAlias' | 'location'>

export type AthleteUpgradeDate = {
  athleteUciId: string,
  discipline: TDiscipline,
  date: string,
  confidence: number
}

export type AthleteManualEdit = {
  uciId: string
  meta: {
    createdAt: string
    createdBy?: string
    updatedAt: string
    updatedBy?: string
  }
} & Partial<Athlete>