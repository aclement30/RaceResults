export type EventResult = {
  raceName: string
  raceNameText: string
  raceAddress: string
  raceDate: string
  raceNotes: string
  organizer: string
  organizerEmail: string        // email
  // raceStartTime: number
  // scheduledStartTime: string    // raceScheduledStart
  // timezone: string              // raceTimeZone
  flags: Record<string, string>

  // raceIsRunning: boolean
  // raceIsUnstarted: boolean
  // raceIsFinished: boolean

  fieldLabels: string[]         // infoFields
  data: RacerResult[]
  // reverseDirection: boolean
  // finishTop: boolean
  isTimeTrial: boolean
  // winAndOut: boolean
  // rfid: boolean
  primes: PrimeResultRow[]
  // lapDetails: any
  // hideDetails: boolean
  // showCourseAnimation: boolean
  // licenseLinkTemplate: string
  // roadRaceFinishTimes: boolean
  // estimateLapsDownFinishTime: boolean
  // version: string
  // timestamp: [string, number]
  categories: RaceCategory[]
  // gpsPoints: number[][]
  // courseCoordinates: number[]
  // riderDashboard: string
  // gpsTotalElevationGain: number
  // gpsAltigraph: number[][]
  // lengthKm: number
}

export type PrimeResultRow = {
  effortType: string
  // effortCustom: string
  position: number
  lapsToGo: number
  // sponsor: string
  // cash: number
  // merchandise: string
  points: number
  timeBonus: number
  winnerBib: number
  winnerInfo: string
}

export type RacerResult = {
  bibNumber: number
  category: string        // Category / raceCat
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

  position: number
  // flr: number
  // interp: number[]
  // lastInterp: boolean
  lapSpeeds: number[]
  finishTime: number
  gapValue: number
  // raceSpeeds: number[]
  // raceTimes: number[]
  avgSpeed: number        // speed
  status: 'FINISHER' | 'DNF' | 'DNS'
  relegated: boolean
}

export type RaceCategory = {
  alias: string           // name
  label: string
  startOffset: number
  gender: 'M' | 'F' | 'X'
  // catType: string
  laps: number
  // pos: number[]
  // gapValue: number[]
  // iSort: number
  starters?: number
  finishers?: number
  distanceUnit?: string
  lapDistance?: number
  raceDistance?: number
}