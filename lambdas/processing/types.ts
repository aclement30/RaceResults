import type { Athlete, BaseAthleteUpgradePoint } from '../../src/types/athletes.ts'
import type { AthleteRaceResult, RaceEvent, TDiscipline } from '../../src/types/results.ts'
import type { EventAthlete } from '../shared/types.ts'

export type AthleteOverrides = {
  replacedUciIds?: Record<string, { old: string, new: string, name: string }>
  levelUpgradeDates?: Record<string, { level: string, date: string, discipline: TDiscipline }[]>
  // Alternate names for athletes (firstName|lastName: uciId)
  alternateNames?: Record<string, string>
  ignoredTeams?: string[]
}

export type RawAthleteEventUpgradePoint = BaseAthleteUpgradePoint

export type CleanAthleteRaceResult = Omit<RawAthleteRaceResult, 'firstName' | 'lastName'> & {
  athleteUciId: string
}

export type RawAthlete =
  Omit<EventAthlete, 'bibNumber' | 'firstName' | 'lastName' | 'gender' | 'team'>
  & Pick<Athlete, 'firstName' | 'lastName' | 'licenses' | 'lastUpdated'>
  & Partial<Pick<Athlete, 'gender'>>
  & {
  uciId: string
  birthYear?: number
}

export type RawAthleteRaceResult = Pick<AthleteRaceResult, 'position' | 'status'> & {
  athleteUciId?: string
  firstName?: string
  lastName?: string
  teamName?: string
  date: RaceEvent['date']
  eventHash: RaceEvent['hash']
  eventType: RaceEvent['sanctionedEventType']
  discipline: RaceEvent['discipline']
  category: string
  upgradePoints: number
  fieldSize: number
}

export type RawAthleteTeam = Record<string, { id?: number, name: string }>