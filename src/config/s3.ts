export const PUBLIC_BUCKET_PATHS = {
  events: 'events/',
  eventsResults: 'events-results/',
  series: 'series/',
  seriesResults: 'series-results/',
  athletes: 'athletes/',
  athletesProfiles: 'athletes-profiles/',
}

export const PUBLIC_BUCKET_FILES = {
  athletes: {
    compilations: `${PUBLIC_BUCKET_PATHS.athletes}compilations.json`,
    list: `${PUBLIC_BUCKET_PATHS.athletes}list.json`,
    lookup: `${PUBLIC_BUCKET_PATHS.athletes}lookup.json`,
    teams: `${PUBLIC_BUCKET_PATHS.athletes}teams.json`,
    upgradePoints: `${PUBLIC_BUCKET_PATHS.athletes}upgrade-points.json`,
  }
}