import type { RawAthleteTeam } from '../types.ts'
import { TeamParser } from '../../shared/team-parser.ts'
import data from '../../shared/data.ts'
import defaultLogger from '../../shared/logger.ts'
import { SCRIPT_NAME } from '../config.ts'

const logger = defaultLogger.child({ parser: SCRIPT_NAME })

export const extractAthletesTeams = async ({ year, eventHashes }: { year: number, eventHashes: string[] }) => {
  await TeamParser.init()
  
  const rawAthletesTeamsForYear = await data.get.rawAthletesTeams(year)

  const extractionResults = await Promise.allSettled(eventHashes.map(async (eventHash) => {
    const eventRaceResults = await data.get.athletesRacesResults({ eventHash, year })

    const allAthletesTeams: Record<string, RawAthleteTeam> = {}

    // Extract all athletes teams from event results
    eventRaceResults.forEach(({ athleteUciId, date, teamName }) => {
      if (!teamName) return

      if (!allAthletesTeams[athleteUciId]) allAthletesTeams[athleteUciId] = {}

      const team = TeamParser.getTeamByName(teamName)
      if (team) {
        allAthletesTeams[athleteUciId][date] = { id: team.id, name: team.name }
      } else {
        allAthletesTeams[athleteUciId][date] = { name: teamName }
      }
    })

    return allAthletesTeams
  }))

  const combinedAthletesTeams: Record<string, RawAthleteTeam> = rawAthletesTeamsForYear

  extractionResults.forEach((parseResult, i) => {
    if (parseResult.status === 'fulfilled') {
      Object.entries(parseResult.value).forEach(([athleteUciId, athleteTeams]) => {
        if (!combinedAthletesTeams[athleteUciId]) {
          combinedAthletesTeams[athleteUciId] = athleteTeams
        } else {
          combinedAthletesTeams[athleteUciId] = { ...combinedAthletesTeams[athleteUciId], ...athleteTeams }
        }
      })
    } else {
      logger.error(`Error while processing athlete teams from event results: ${parseResult.reason}`, {
        hash: eventHashes[i],
        year,
        error: parseResult.reason
      })
    }
  })

  try {
    logger.info(`Saving ${Object.keys(combinedAthletesTeams).length} raw athletes teams for year ${year}`)
    await data.update.rawAthletesTeams(combinedAthletesTeams, { year })
  } catch (error) {
    logger.error(`Failed to save extracted teams: ${(error as Error).message}`, { error })
  }
}