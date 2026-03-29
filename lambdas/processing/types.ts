import type {
  BaseAthlete,
  BaseAthleteUpgradePoint,
  ParticipantResult,
  RaceEvent,
  TDiscipline
} from '../shared/types.ts'

export type AthleteOverrides = {
  replacedUciIds?: Record<string, { old: string, new: string, name: string }>
  levelUpgradeDates?: Record<string, { level: string, date: string, discipline: TDiscipline }[]>
  // Alternate names for athletes (firstName|lastName: uciId)
  alternateNames?: Record<string, string>
  ignoredTeams?: string[]
}

export type RawAthlete = Omit<BaseAthlete, 'skillLevel' | 'ageCategory' | 'latestUpgrade'>

export type RawAthleteRaceResult =
  Pick<ParticipantResult, 'firstName' | 'lastName' | 'position' | 'status'>
  & {
  athleteUciId?: string
  teamName: ParticipantResult['team']
  date: RaceEvent['date']
  eventHash: RaceEvent['hash']
  eventType: RaceEvent['sanctionedEventType']
  discipline: RaceEvent['discipline']
  categoryAlias: string
  categoryLabel: string
  upgradePoints: number
  fieldSize: number
}

export type CleanAthleteRaceResult = Omit<RawAthleteRaceResult, 'firstName' | 'lastName'> & {
  athleteUciId: string
}

export type RawAthleteTeam = Record<string, { id?: number, name: string }>

export type RawAthleteEventUpgradePoint = BaseAthleteUpgradePoint
