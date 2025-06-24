import type {
  AthleteRaceResult,
  EventAthlete,
  EventCategory,
  EventSummary,
  SerieResults,
  SerieSummary
} from '../../../src/types/results.ts'

export type CleanEventWithResults = Omit<EventSummary, 'categories'> & CleanEventResults
export type CleanSerieWithResults = Omit<SerieSummary, 'categories'> & SerieResults

export type CleanEventResults = {
  hash: string
  athletes: Record<string, CleanEventAthlete>
  results: Record<string, EventCategory & { results: CleanAthleteRaceResult[] }>
  sourceUrls: string[]
  raceNotes?: string
  lastUpdated: string
}

export type CleanEventAthlete = EventAthlete & {
  gender?: 'M' | 'F' | 'X'
  age?: number                  // Age
  license?: string              // License
  nationality?: string           // NatCode
  eventCategories: string[]     // Category
}

export type CleanAthleteRaceResult = AthleteRaceResult & {
  lapTimes?: number[]       // raceTimes
}