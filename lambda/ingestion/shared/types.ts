import type {
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
  raceNotes: string
  lastUpdated: string
}

export type CleanEventAthlete = EventAthlete & {
  gender?: 'M' | 'F' | 'X'
  age?: number             // Age
  province?: string | null // Province
  license?: string         // License
  nationality?: string     // NatCode
}

export type CleanAthleteRaceResult = {
  position: number
  bibNumber: number
  // flr: number
  // interp: number[]
  // lastInterp: boolean
  lapSpeeds?: number[]
  lapDurations?: number[]   // (raceTimes)
  lapTimes?: number[]       // raceTimes
  finishTime: number
  finishGap: number        // gapValue
  // raceSpeeds: number[]
  // raceTimes: number[]
  avgSpeed: number        // speed
  status: 'FINISHER' | 'DNF' | 'DNS' | 'OTL'
  relegated?: boolean
  upgradePoints?: number | null
}