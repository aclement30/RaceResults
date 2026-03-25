import { s3 as RRS3 } from '../utils.ts'
import { PUBLIC_BUCKET_FILES, PUBLIC_BUCKET_PATHS } from '../../../src/config/s3.ts'
import type { Team, TeamRoster } from '../types.ts'
import { DataError, DataErrorCode } from '../data.ts'
import { TeamSchema } from '../../../shared/schemas/teams.ts'

export const getTeams = async (): Promise<Team[]> => {
  const fileContent = await RRS3.fetchFile(PUBLIC_BUCKET_FILES.athletes.teams)

  if (!fileContent) return []

  return JSON.parse(fileContent) as Team[]
}

export const updateTeam = async (team: Team) => {
  TeamSchema.parse(team)

  const existingTeams = await getTeams()

  const updatedTeams = [...existingTeams.filter(t => t.id !== team.id), team]

  await RRS3.writeFile(PUBLIC_BUCKET_FILES.athletes.teams, JSON.stringify(updatedTeams))
}

export const restoreTeam = async (teamId: number) => {
  const existingTeams = await getTeams()

  const teamIdx = existingTeams.findIndex(t => t.id === teamId)

  if (teamIdx < 0) throw new DataError(`Team with id ${teamId} not found`, DataErrorCode.ENTITY_NOT_FOUND)

  const updatedTeams = [...existingTeams]
  updatedTeams[teamIdx].deleted = false

  await RRS3.writeFile(PUBLIC_BUCKET_FILES.athletes.teams, JSON.stringify(updatedTeams))
}

export const deleteTeam = async (teamId: number) => {
  const existingTeams = await getTeams()

  const teamIdx = existingTeams.findIndex(t => t.id === teamId)

  if (teamIdx < 0) throw new DataError(`Team with id ${teamId} not found`, DataErrorCode.ENTITY_NOT_FOUND)

  const updatedTeams = [...existingTeams]
  updatedTeams[teamIdx].deleted = true

  await RRS3.writeFile(PUBLIC_BUCKET_FILES.athletes.teams, JSON.stringify(updatedTeams))
}

export const getTeamRosters = async (year: string | number): Promise<TeamRoster[]> => {
  const filename = PUBLIC_BUCKET_PATHS.teamRosters + `${year}.json`

  const fileContent = await RRS3.fetchFile(filename, true)

  if (!fileContent) return []

  return JSON.parse(fileContent as any) as TeamRoster[]
}

export const updateTeamRosters = async (teamRosters: TeamRoster[], year: string | number): Promise<void> => {
  const existingTeamRosters = await getTeamRosters(year)

  const filename = PUBLIC_BUCKET_PATHS.teamRosters + `${year}.json`

  const updatedTeamRosters = [
    ...existingTeamRosters.filter(tr => !teamRosters.some(t => t.teamId === tr.teamId)),
    ...teamRosters
  ]

  // Check that the athletes in teamRosters are not present in other team rosters for the same year
  teamRosters.forEach((teamRoster: TeamRoster) => {
    teamRoster.athletes.forEach((athlete) => {
      const otherConflictingRosters = updatedTeamRosters.filter(tr => tr.teamId !== teamRoster.teamId && tr.athletes.some(a => a.athleteUciId === athlete.athleteUciId))

      if (otherConflictingRosters.length) {
        throw new Error(`Athlete with UCI ID ${athlete.athleteUciId} is listed in multiple team rosters for year ${year}: ${otherConflictingRosters.map(r => r.teamId).join(', ')}`)
      }
    })
  })

  await RRS3.writeFile(filename, JSON.stringify(updatedTeamRosters))
}