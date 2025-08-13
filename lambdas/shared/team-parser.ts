import type { Team } from '../../src/types/team.ts'
import { PUBLIC_BUCKET_FILES } from '../../src/config/s3.ts'
import { s3 } from './utils.ts'

class TeamParserSingleton {
  private _teams: Record<string, Team>
  private _teamsByNames: Record<string, Team>
  private _teamsByUniqueKeywords: Record<string, Team>

  constructor() {
    this._teams = {}
    this._teamsByNames = {}
    this._teamsByUniqueKeywords = {}
  }

  public async init() {
    // Check if already initialized
    if (Object.keys(this._teams).length > 0) return

    let fileContent

    try {
      fileContent = await s3.fetchFile(PUBLIC_BUCKET_FILES.athletes.teams)
    } catch (error) {
      throw error
    }

    if (!fileContent) throw new Error('Empty teams file')

    this._teams = JSON.parse(fileContent) as Record<string, Team>

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
  }

  public getTeamByName(name: string): Team | undefined {
    const matchingTeam = this._teamsByNames[name.toLowerCase()]

    if (matchingTeam) return matchingTeam

    return this.getTeamByKeyword(name)
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