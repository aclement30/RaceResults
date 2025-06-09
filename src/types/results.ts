import { BC_SANCTIONED_EVENT_TYPES } from '../config/upgrade-points.ts'

export type SanctionedEventType = keyof typeof BC_SANCTIONED_EVENT_TYPES

export type EventSummary = {
  hash: string
  name: string
  date: string
  year: number
  type: 'event'
  organizerAlias: string
  organizerOrg?: string
  organizerName: string
  organizerEmail?: string            // email
  sanctionedEventType: SanctionedEventType | null
  hasUpgradePoints: 'UPGRADE' | 'SUBJECTIVE' | false
  isDoubleUpgradePoints: boolean
  serie?: string | null
  // series?: string | null // deprecated, use `serie` instead
  // timezone: string               // raceTimeZone
  flags?: Record<string, string>
  isTimeTrial: boolean
  provider: string
  categories: BaseCategory[]
}

export type EventResults = {
  hash: string
  athletes: Record<string, EventAthlete>
  results: Record<string, EventCategory>
  sourceUrls: string[]
  raceNotes: string
  lastUpdated: string
  // raceStartTime: number
  // scheduledStartTime: string     // raceScheduledStart
  // raceIsRunning: boolean
  // raceIsUnstarted: boolean
  // raceIsFinished: boolean
  // fieldLabels: string[]           // infoFields
  // data: AthleteRaceResult[]
  // reverseDirection: boolean
  // finishTop: boolean
  // isTimeTrial: boolean
  // winAndOut: boolean
  // rfid: boolean
  // primes: PrimeResult[]
  // lapDetails: any
  // hideDetails: boolean
  // showCourseAnimation: boolean
  // licenseLinkTemplate: string
  // roadRaceFinishTimes: boolean
  // estimateLapsDownFinishTime: boolean
  // version: string
  // timestamp: [string, number]
  // categories: EventCategory[]
  // gpsPoints: number[][]
  // courseCoordinates: number[]
  // riderDashboard: string
  // gpsTotalElevationGain: number
  // gpsAltigraph: number[][]
  // lengthKm: number
}

export type RaceEvent = EventSummary & EventResults

export type PrimeResult = {
  number: number
  position: number
  bibNumber: number
  // effortType: string
  // effortCustom: string
  // lapsToGo: number
  // sponsor: string
  // cash: number
  // merchandise: string
  // points: number
  // timeBonus: number
  // winnerBib: number
  // winnerInfo: string
}

export type EventAthlete = {
  bibNumber: number
  firstName: string
  lastName: string
  city: string | null
  province: string | null
  uciId: string | null
  team: string | null
}

export type AthleteRaceResult = {
  position: number
  bibNumber: number
  // flr: number
  // interp: number[]
  // lastInterp: boolean
  lapSpeeds?: number[]
  lapDurations?: number[]   // (raceTimes)
  lapGaps?: Array<number | null> // gaps between laps, if applicable
  // lapTimes?: number[]       // raceTimes
  finishTime: number
  finishGap: number        // gapValue
  // raceSpeeds: number[]
  // raceTimes: number[]
  avgSpeed: number        // speed
  status: 'FINISHER' | 'DNF' | 'DNS' | 'OTL'
  relegated?: boolean
  upgradePoints?: number | null
}

export type BaseCategory = {
  alias: string           // name
  label: string
  gender: 'M' | 'F' | 'X'
}

export type EventCategory = BaseCategory & {
  startOffset: number
  // pos: number[]
  // gapValue: number[]
  // iSort: number
  laps?: number
  results: AthleteRaceResult[]
  primes?: PrimeResult[]
  starters?: number
  finishers?: number
  distanceUnit?: string
  lapDistance?: number
  raceDistance?: number
  fieldSize?: number              // combined field size, used for upgrade points calculation
  combinedCategories?: string[] | null   // aliases of combined categories, if applicable
}

export type SerieSummary = {
  hash: string
  alias: string
  name: string
  year: number
  type: 'serie'
  organizerAlias: string
  provider: string
  categories: {
    individual?: BaseCategory[]
    team?: BaseCategory[]
  }
}

export type SerieResults = {
  hash: string
  individual?: {
    results: Record<string, SerieIndividualCategory>
    sourceUrls: string[]
  }
  team?: {
    results: Record<string, SerieTeamCategory>
    sourceUrls: string[]
  }
  lastUpdated: string
}

export type AthleteSerieResult = {
  position: number
  bibNumber?: number
  firstName: string
  lastName: string
  // license?: string
  uciId: string | null
  team: string | null
  totalPoints: number
  racePoints: Record<string, number>
}

export type SerieIndividualCategory = BaseCategory & {
  results: AthleteSerieResult[]
}

export type SerieTeamCategory = BaseCategory & {
  results: TeamSerieResult[]
}

export type TeamSerieResult = {
  position: number
  team: string
  totalPoints: number
  racePoints?: Record<string, number>
}
