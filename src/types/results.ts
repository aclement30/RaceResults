import { BC_SANCTIONED_EVENT_TYPES } from '../config/event-types.ts'

const Discipline = {
  'ROAD': 'ROAD',
  'CX': 'CX',
} as const

export type TDiscipline = typeof Discipline[keyof typeof Discipline];

const Gender = {
  'M': 'M',
  'F': 'F',
  'X': 'X',
} as const

export type TGender = typeof Gender[keyof typeof Gender];

export type SanctionedEventType = keyof typeof BC_SANCTIONED_EVENT_TYPES

export type EventSummary = {
  hash: string
  name: string
  date: string
  year: number
  type: 'event'
  discipline: TDiscipline
  location: {
    city: string
    province: string
    country: 'CA' | 'US'
  }
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
  raceNotes?: string
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
  athleteId: string
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

export type UpgradePointResult = {
  position: number
  athleteId: string
  points: number
}

export type EventAthlete = Partial<{
  bibNumber: number
  firstName: string
  lastName: string
  city: string
  province: string
  uciId: string
  team: string
}>

export type AthleteRaceResult = {
  athleteId: string
  position: number
  bibNumber?: number
  // flr: number
  // interp: number[]
  // lastInterp: boolean
  lapSpeeds?: number[]
  lapDurations?: number[]   // (raceTimes)
  lapGaps?: Array<number | null> // gaps between laps, if applicable
  finishTime: number
  finishGap: number | null       // gapValue
  // raceSpeeds: number[]
  // raceTimes: number[]
  avgSpeed?: number        // speed
  status: 'FINISHER' | 'DNF' | 'DNS' | 'OTL'
  relegated?: boolean
  upgradePoints?: number
}

export type BaseCategory = {
  alias: string           // name
  label: string
  gender: TGender
  combinedCategories?: string[]   // aliases of combined categories, if applicable
  umbrellaCategory?: string       // alias of the parent category, if this is a subcategory
}

export type EventCategory = BaseCategory & {
  // startOffset: number
  startTime?: number
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
  upgradePoints?: UpgradePointResult[]
  fieldSize?: number              // combined field size, used for upgrade points calculation
  corrections?: string
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
  lastUpdated: string
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
  athleteId: string
  position: number
  bibNumber?: number
  firstName: string
  lastName: string
  uciId?: string
  team?: string
  totalPoints: number
  racePoints: Record<string, number>
}

export type SerieIndividualCategory = BaseCategory & {
  results: AthleteSerieResult[]
  corrections?: string
}

export type SerieTeamCategory = BaseCategory & {
  results: TeamSerieResult[]
  corrections?: string
}

export type TeamSerieResult = {
  position: number
  team: string
  totalPoints: number
  racePoints?: Record<string, number>
}
