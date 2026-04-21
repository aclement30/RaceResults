import type { RaceEvent, TDiscipline } from '../../shared/types/index.ts'

export type * from '../../shared/types/adminUsers.ts'
export type * from '../../shared/types/athletes.ts'
export type * from '../../shared/types/events.ts'
export type * from '../../shared/types/series.ts'
export type * from '../../shared/types/organizers.ts'
export type * from '../../shared/types/teams.ts'

// Lambdas-specific types

export type AthleteSkillCategory = {
  athleteUciId: string
  skillLevels: { ROAD?: Record<string, string>, CX?: Record<string, string> }
  ageCategory: string | null
}

export type EventSummary =
  Pick<RaceEvent, 'hash' | 'date' | 'serie' | 'sanctionedEventType' | 'name' | 'discipline' | 'organizerAlias' | 'location'>

export type AthleteUpgradeDate = {
  athleteUciId: string,
  discipline: TDiscipline,
  date: string,
  confidence: number
}

export type RaceEventChange = {
  year: number
  eventHashes: string[]
}

export type IngestEvent = RaceEventChange & {
  seriesHashes: string[]
  provider: string
}
