import { fetchAthleteLookupTable, fetchAthletesList, fetchEventYears, fetchTeamsList } from './aws-s3'

export async function loadStartupData() {
  const [athletes, lookupTable, teams, years] = await Promise.all([
    fetchAthletesList(),
    fetchAthleteLookupTable(),
    fetchTeamsList(),
    fetchEventYears(),
  ])

  return {
    athletes,
    lookupTable,
    teams,
    years,
  }
}