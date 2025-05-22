import type { BaseEvent } from '../utils/loadStartupData'

export type EventInfo = BaseEvent & {
  // raceName: string
  // raceNameText: string
  // raceAddress: string
  // raceDate: string
  // raceNotes: string
  // organizer: string
  organizerEmail: string            // email
  // timezone: string               // raceTimeZone
  flags?: Record<string, string>
  isTimeTrial: boolean
}

export type EventStats = {
  athletes: Record<string, Athlete>
  categories: BaseEventCategory[]
  results: Record<string, EventCategory>
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

export type Athlete = {
  bibNumber: number
  firstName: string       // FirstName
  lastName: string        // LastName
  age: number             // Age
  gender: 'M' | 'F' | 'X' // Gender
  city: string            // City
  state: string           // StateProv
  license: string         // License
  uciId: string           // UCIID
  // natCode: string      // NatCode
  team: string            // Team
}

export type AthleteRaceResult = {
  position: number
  bibNumber: number
  // flr: number
  // interp: number[]
  // lastInterp: boolean
  lapSpeeds: number[]
  lapDurations: number[]   // (raceTimes)
  lapTimes: number[]       // raceTimes
  finishTime: number
  finishGap: number        // gapValue
  // raceSpeeds: number[]
  // raceTimes: number[]
  avgSpeed: number        // speed
  status: 'FINISHER' | 'DNF' | 'DNS' | 'OTL'
  relegated: boolean
}

export type BaseEventCategory = {
  alias: string           // name
  label: string
  gender: 'M' | 'F' | 'X'
  laps: number
  // catType: string
}

export type EventCategory = BaseEventCategory & {
  startOffset: number
  // pos: number[]
  // gapValue: number[]
  // iSort: number
  results: AthleteRaceResult[]
  primes: PrimeResult[]
  starters?: number
  finishers?: number
  distanceUnit?: string
  lapDistance?: number
  raceDistance?: number
}