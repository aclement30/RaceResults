import { fetchAthleteLookupTable, fetchAthletesList, fetchEventYears, fetchTeamsList } from './aws-s3'

export async function loadStartupData() {
  const [athletes, lookupTable, teams, years] = await Promise.all([
    fetchAthletesList(),
    fetchAthleteLookupTable(),
    fetchTeamsList(),
    fetchEventYears(),
  ])

  const favoriteAthletesString = localStorage.getItem('favorite-athletes')
  const favoriteAthletes = favoriteAthletesString ? JSON.parse(favoriteAthletesString) : []
  const favoriteTeamsString = localStorage.getItem('favorite-teams')
  const favoriteTeams = favoriteTeamsString ? JSON.parse(favoriteTeamsString) : []
  
  return {
    athletes,
    lookupTable,
    teams,
    years,
    favoriteAthletes,
    favoriteTeams,
  }
}