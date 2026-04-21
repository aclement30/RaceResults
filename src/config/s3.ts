export const PUBLIC_BUCKET_PATHS = {
  events: 'events/',
  eventsResults: 'events_results/',
  series: 'series/',
  seriesStandings: 'series_standings/',
  athletes: 'athletes/',
  athletesProfiles: 'views/athletes_profiles/',
  teamRosters: 'team_rosters/',
}

export const PUBLIC_BUCKET_FILES = {
  athletes: {
    list: 'views/athletes.json',
    lookup: 'athletes_lookup.json',
    teams: 'teams.json',
  },
  organizers: 'organizers.json',
  views: {
    recentlyUpgradedAthletes: 'views/recently_upgraded_athletes.json',
  }
}