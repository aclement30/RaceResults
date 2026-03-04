import {
  getBaseAthletes,
  getAthletesCategories,
  getAthletesLookup,
  getAthletesOverrides,
  getAthletesRacesResults,
  getAthletesUpgradeDates,
  getAthletesUpgradePoints,
  updateAthleteCategories,
  updateBaseAthletes,
  updateAthletesLookup,
  updateAthletesRacesResults,
  updateAthletesUpgradePoints,
  getAthleteManualEdits,
  updateAthleteManualEdits
} from './data/athletes.ts'
import { getRawBCMembershipDates, getRawBCMembershipsForDate, updateRawBCMemberships } from './data/bc-memberships.ts'
import { getEventResults, getEvents, updateEvents, updateEventResults } from './data/events.ts'
import {
  getEventDays, getLastCheckDate, getRawAthletesRaceResults, getRawAthletesTeams,
  getRawAthletesUpgradePoints, getRawEventAthletes,
  getRawIngestionData,
  updateLastCheckDate,
  updateRawAthletesRaceResults,
  updateRawAthletesTeams, updateRawAthletesUpgradePoints,
  updateRawEventAthletes, updateRawIngestionData
} from './data/ingestion.ts'
import { updateSeries, updateSerieResults } from './data/series.ts'
import { getTeams } from './data/teams.ts'
import {
  getAthleteProfile,
  getViewAthletes,
  updateAthleteProfile,
  updateViewAthletes,
  updateViewRecentlyUpgradedAthletes
} from './data/views.ts'

export default {
  get: {
    baseAthletes: getBaseAthletes,
    viewAthletes: getViewAthletes,
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
    rawBCMemberships: getRawBCMembershipsForDate,
    rawBCMembershipDates: getRawBCMembershipDates,
    rawEventAthletes: getRawEventAthletes,
    rawAthletesRaceResults: getRawAthletesRaceResults,
    rawAthletesTeams: getRawAthletesTeams,
    rawAthletesUpgradePoints: getRawAthletesUpgradePoints,
    rawIngestionData: getRawIngestionData,
    teams: getTeams,
  },
  update: {
    baseAthletes: updateBaseAthletes,
    viewAthletes: updateViewAthletes,
    athleteManualEdits: updateAthleteManualEdits,
    athletesCategories: updateAthleteCategories,
    athletesLookup: updateAthletesLookup,
    athletesRacesResults: updateAthletesRacesResults,
    athletesUpgradePoints: updateAthletesUpgradePoints,
    athleteProfile: updateAthleteProfile,
    events: updateEvents,
    eventResults: updateEventResults,
    lastCheckDate: updateLastCheckDate,
    series: updateSeries,
    serieResults: updateSerieResults,
    rawBCMemberships: updateRawBCMemberships,
    rawEventAthletes: updateRawEventAthletes,
    rawAthletesRaceResults: updateRawAthletesRaceResults,
    rawAthletesTeams: updateRawAthletesTeams,
    rawAthletesUpgradePoints: updateRawAthletesUpgradePoints,
    rawIngestionData: updateRawIngestionData,
    viewRecentlyUpgradedAthletes: updateViewRecentlyUpgradedAthletes,
  }
}