import type { Team, TeamRoster } from './types.ts'
import data from './data.ts'
import { keyBy } from 'lodash-es'

const CURRENT_YEAR = new Date().getFullYear()

class TeamParserSingleton {
  private _teams: Record<string, Team>
  private _teamsByNames: Record<string, Team>
  private _teamsByUniqueKeywords: Record<string, Team>
  private _manualAthleteTeams: Record<string, Record<string, number>>

  constructor() {
    this._teams = {}
    this._teamsByNames = {}
    this._teamsByUniqueKeywords = {}
    this._manualAthleteTeams = {}
  }

  public async init() {
    // Check if already initialized
    if (Object.keys(this._teams).length > 0) return

    let teams, teamRosters

    try {
      ;([
        teams,
        teamRosters,
      ] = await Promise.all([
        data.get.teams(),
        data.get.teamRosters(CURRENT_YEAR),
      ]))
    } catch (error) {
      throw error
    }

    this._teams = keyBy(teams, 'id')

    // Create a lookup by team name
    const teamsByNames: Record<string, Team> = {}
    const teamsByUniqueKeywords: Record<string, Team> = {}

    Object.values(this._teams).forEach((team) => {
      teamsByNames[team.name.toLowerCase()] = team

      if (team.alternateNames) {
        team.alternateNames.forEach((name) => {
          teamsByNames[name.toLowerCase()] = team
        })
      }

      if (team.uniqueKeywords) {
        team.uniqueKeywords.forEach((keyword) => {
          teamsByUniqueKeywords[keyword.toLowerCase()] = team
        })
      }
    })

    this._teamsByNames = teamsByNames
    this._teamsByUniqueKeywords = teamsByUniqueKeywords

    // Create a lookup for manual athlete team assignments
    const manualAthleteTeams: Record<string, Record<string, number>> = { [CURRENT_YEAR]: {} }
    teamRosters.forEach((roster) => {
      roster.athletes.forEach(({ athleteUciId, source }) => {
        if (source === 'manual') manualAthleteTeams[CURRENT_YEAR][athleteUciId] = roster.teamId
      })
    })
    this._manualAthleteTeams = manualAthleteTeams
  }

  public getTeamByName(name: string): Team | undefined {
    const matchingTeam = this._teamsByNames[name.toLowerCase()]

    if (matchingTeam) return matchingTeam

    return this.getTeamByKeyword(name)
  }

  public getManualTeamForAthlete(athleteUciId: string, year: number): Team | null {
    if (this._manualAthleteTeams[year] && this._manualAthleteTeams[year][athleteUciId]) {
      const teamId = this._manualAthleteTeams[year][athleteUciId]
      if (teamId === 0) return null // Explicitly marked as independent
      return this._teams[teamId] || null
    }

    return null
  }

  public parseTeamName(name: string | undefined | null): { id?: number, name?: string } | undefined {
    if (!name) return

    const formattedName = name.trim()
    const teamLower = formattedName.toLowerCase()

    if (['no team', 'n/a', 'independent', 'independant', 'unattached'].includes(teamLower)) return

    const matchingTeam = this.getTeamByName(teamLower)

    if (matchingTeam) {
      return {
        id: matchingTeam.id,
        name: matchingTeam.name,
      }
    }

    return { name: formattedName }
  }

  private getTeamByKeyword(name: string): Team | undefined {
    const nameLower = name.toLowerCase()
    const matchingKeyword = Object.keys(this._teamsByUniqueKeywords).find((keyword) => nameLower.includes(keyword))
    return matchingKeyword ? this._teamsByUniqueKeywords[matchingKeyword] : undefined
  }
}

const TeamParser = new TeamParserSingleton()

export { TeamParser }