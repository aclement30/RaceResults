export type CrossMgrEventFile = {
  hash: string
  type: 'event' | 'series' | 'doc' | 'startlist'
  date: string | null
  year: number
  organizer: string
  series?: string | null
  lastUpdated: string
  files: string[]
}

export type CrossMgrEventResultPayload = {
  raceName: string
  infoFields: string[]
  organizer: string
  reverseDirection: boolean
  finishTop: boolean
  isTimeTrial: boolean
  winAndOut: boolean
  rfid: boolean
  primes: CrossMgrPrimeResult[]
  raceNameText: string
  raceDate: string
  raceScheduledStart: string
  raceTimeZone: string
  raceAddress: string
  raceIsRunning: boolean
  raceIsUnstarted: boolean
  raceIsFinished: boolean
  lapDetails: any
  hideDetails: boolean
  showCourseAnimation: boolean
  licenseLinkTemplate: string
  roadRaceFinishTimes: boolean
  estimateLapsDownFinishTime: boolean
  email: string
  version: string
  raceNotes: string
  raceStartTime: number
  timestamp: [string, number]
  data?: Record<string, CrossMgrResultRow>
  catDetails?: CrossMgrRaceCategory[]
  flags: Record<string, string>
  gpsPoints: number[][]
  courseCoordinates: number[]
  riderDashboard: string
  gpsTotalElevationGain: number
  gpsAltigraph: number[][]
  lengthKm: number
}

type CrossMgrPrimeResult = {
  effortType: string
  effortCustom: string
  position: number
  lapsToGo: number
  sponsor: string
  cash: number
  merchandise: string
  points: number
  timeBonus: number
  winnerBib: number
  winnerInfo: string
}

type CrossMgrResultRow = {
  flr: number
  relegated: boolean
  Age: number
  Category: string
  City: string
  FirstName: string
  Gender: string
  LastName: string
  License: string
  NatCode: string
  StateProv: string
  Team: string
  UCIID: string
  interp: number[]
  lapSpeeds: number[]
  lastInterp: boolean
  lastTime: number
  lastTimeOrig: number
  raceCat: string
  raceSpeeds: number[]
  raceTimes: number[]
  speed: string
  status: string
}

type CrossMgrRaceCategory = {
  name: string
  startOffset: number
  gender: string
  catType: string
  laps: number
  pos: number[]
  gapValue: number[]
  iSort: number
  starters?: number
  finishers?: number
  distanceUnit?: string
  lapDistance?: number
  raceDistance?: number
}