import {
  getAthleteManualEdits,
  getAthletesCategories,
  getAthletesLookup,
  getAthletesOverrides,
  getAthletesRacesResults,
  getAthletesUpgradeDates,
  getAthletesUpgradePoints,
  getBaseAthletes,
  updateAthleteCategories,
  updateAthleteManualEdit,
  updateAthletesLookup,
  updateAthletesRacesResults,
  updateAthletesUpgradePoints,
  updateBaseAthletes
} from './data/athletes.ts'
import { getRawBCMembershipDates, getRawBCMembershipsForDate, updateRawBCMemberships } from './data/bc-memberships.ts'
import { deleteEvent, getEventResults, getEvents, updateEventResults, updateEvents } from './data/events.ts'
import {
  getEventDays,
  getLastCheckDate,
  getRawAthletesRaceResults,
  getRawAthletesTeams,
  getRawAthletesUpgradePoints,
  getRawEventAthletes,
  getRawIngestionData,
  updateLastCheckDate,
  updateRawAthletesRaceResults,
  updateRawAthletesTeams,
  updateRawAthletesUpgradePoints,
  updateRawEventAthletes,
  updateRawIngestionData
} from './data/ingestion.ts'
import { getOrganizers } from './data/organizers.ts'
import { getRules } from './data/rules.ts'
import { getSeries, updateSerieResults, updateSeries } from './data/series.ts'
import { deleteTeam, getTeamRosters, getTeams, restoreTeam, updateTeam, updateTeamRosters } from './data/teams.ts'
import {
  getAthleteProfile,
  getViewAthletes,
  updateAthleteProfile,
  updateViewAthletes,
  updateViewRecentlyUpgradedAthletes,
} from './data/views.ts'

export const DataErrorCode = {
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  INVALID_DATA: 'INVALID_DATA',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  ENTITY_NOT_FOUND: 'ENTITY_NOT_FOUND'
} as const

export type DataErrorCode = typeof DataErrorCode[keyof typeof DataErrorCode]

export class DataError extends Error {
  code: DataErrorCode

  constructor(message: string, code: DataError['code']) {
    super(message)
    this.name = 'DataError'
    this.code = code
    Object.setPrototypeOf(this, DataError.prototype)
  }
}

export default {
  get: {
    baseAthletes: getBaseAthletes,
    athletes: getViewAthletes,
    athleteManualEdits: getAthleteManualEdits,
    athletesCategories: getAthletesCategories,
    athletesLookup: getAthletesLookup,
    athletesOverrides: getAthletesOverrides,
    athletesRacesResults: getAthletesRacesResults,
    athletesUpgradePoints: getAthletesUpgradePoints,
    athletesUpgradeDates: getAthletesUpgradeDates,
    athleteProfile: getAthleteProfile,
    events: getEvents,
    eventDays: getEventDays,
    eventResults: getEventResults,
    lastCheckDate: getLastCheckDate,
    organizers: getOrganizers,
    rawBCMemberships: getRawBCMembershipsForDate,
    rawBCMembershipDates: getRawBCMembershipDates,
    rawEventAthletes: getRawEventAthletes,
    rawAthletesRaceResults: getRawAthletesRaceResults,
    rawAthletesTeams: getRawAthletesTeams,
    rawAthletesUpgradePoints: getRawAthletesUpgradePoints,
    rawIngestionData: getRawIngestionData,
    rules: getRules,
    series: getSeries,
    teams: getTeams,
    teamRosters: getTeamRosters,
  },
  update: {
    baseAthletes: updateBaseAthletes,
    athletes: updateViewAthletes,
    athleteManualEdit: updateAthleteManualEdit,
    athletesCategories: updateAthleteCategories,
    athletesLookup: updateAthletesLookup,
    athletesRacesResults: updateAthletesRacesResults,
    athletesUpgradePoints: updateAthletesUpgradePoints,
    athleteProfile: updateAthleteProfile,
    events: updateEvents,
    eventResults: updateEventResults,
    lastCheckDate: updateLastCheckDate,
    rawBCMemberships: updateRawBCMemberships,
    rawEventAthletes: updateRawEventAthletes,
    rawAthletesRaceResults: updateRawAthletesRaceResults,
    rawAthletesTeams: updateRawAthletesTeams,
    rawAthletesUpgradePoints: updateRawAthletesUpgradePoints,
    rawIngestionData: updateRawIngestionData,
    viewRecentlyUpgradedAthletes: updateViewRecentlyUpgradedAthletes,
    series: updateSeries,
    serieResults: updateSerieResults,
    team: updateTeam,
    teamRosters: updateTeamRosters,
  },
  restore: {
    team: restoreTeam,
  },
  delete: {
    event: deleteEvent,
    team: deleteTeam,
  },
}