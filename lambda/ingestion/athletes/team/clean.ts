import defaultLogger from '../../shared/logger.ts'
import { CLEAN_ATHLETE_TEAMS_FILE, PARSER_NAME } from '../config.ts'
import type {
  AthleteOverrides,
  CleanAthlete,
  CleanAthleteEventRaces,
  CleanAthleteRace, CleanAthleteTeam,
} from '../types.ts'
import { s3 as RRS3 } from '../../shared/utils.ts'
import { TeamParser } from '../../shared/team-parser.ts'
import type { Athlete } from '../../../../src/types/athletes.ts'
import { DEBUG } from '../../shared/config.ts'

const logger = defaultLogger.child({ parser: PARSER_NAME })

const unknownTeams: string[] = []
const currentYear = new Date().getFullYear()

export default async (
  allAthleteData: Record<string, CleanAthlete>,
  allAthleteRaces: CleanAthleteEventRaces,
  allAthleteOverrides: AthleteOverrides,
) => {
  const processingResults = await Promise.allSettled(Object.keys(allAthleteData).map(async (athleteUciId) => {
    const athleteRaces = allAthleteRaces[athleteUciId] || []

    const athleteTeams = extractAthleteTeams(athleteRaces, allAthleteOverrides.ignoredTeams)
    const years = [...new Set(Object.keys(athleteTeams).map(date => +date.slice(0, 4)))]

    if (!years.includes(currentYear)) years.push(currentYear)

    const athleteTeamByYears: CleanAthleteTeam = {}

    years.forEach(year => {
      // Check if the athlete has an override for the team in this year
      const athleteDataOverride = allAthleteOverrides.athleteData?.[athleteUciId]
      if (athleteDataOverride && `team.${year}` in athleteDataOverride) {
        const teamName = athleteDataOverride[`team.${year}`]
        if (teamName) {
          const team = TeamParser.getTeamByName(teamName)
          athleteTeamByYears[year] = team ? { id: team.id, name: team.name } : { name: teamName }
        } else {
          // If no team name is provided in the override, skip this year
        }
        return
      }

      const team = guessAthleteTeamForYear(year, athleteTeams, athleteUciId)
      if (team) athleteTeamByYears[year] = team
    })

    return athleteTeamByYears
  }))

  if (DEBUG) {
    console.log('Unknown teams:')
    console.log(unknownTeams)
  }

  let teamsByAthletes: Record<string, Required<Athlete>['team']> = {}

  processingResults.forEach((parseResult, i) => {
    if (parseResult.status === 'fulfilled') {
      const athleteUciId = Object.keys(allAthleteData)[i]
      teamsByAthletes[athleteUciId] = parseResult.value
    } else {
      const athleteUciId = Object.keys(allAthleteData)[i]
      const athlete = allAthleteData[athleteUciId]

      logger.error(`Error while processing athlete team: ${parseResult.reason}`, {
        athlete: { athleteUciId, firstName: athlete.firstName, lastName: athlete.lastName },
        error: parseResult.reason
      })
    }
  })

  logger.info(`Total athletes processed: ${teamsByAthletes.length}`)

  try {
    logger.info(`Uploading athlete teams data to ${CLEAN_ATHLETE_TEAMS_FILE}`)
    await RRS3.writeFile(CLEAN_ATHLETE_TEAMS_FILE, JSON.stringify(teamsByAthletes))
  } catch (error) {
    console.trace(error)
    logger.error(`Failed to save athlete teams: ${(error as Error).message}`, { error })
  }

  return teamsByAthletes
}

const extractAthleteTeams = (
  athleteRaces: CleanAthleteRace[],
  ignoredTeams?: AthleteOverrides['ignoredTeams'],
): Record<string, { id?: number, name?: string }> => {
  const athleteTeams: Record<string, { id?: number, name?: string }> = {}

  athleteRaces.forEach(({ date, teamName }) => {
    if (!teamName) return

    const team = TeamParser.getTeamByName(teamName)
    if (team) {
      athleteTeams[date] = { id: team.id, name: team.name }
    } else {
      athleteTeams[date] = { name: teamName }
      if (!ignoredTeams?.includes(teamName) && !unknownTeams.includes(teamName)) unknownTeams.push(teamName)
    }
  })

  return athleteTeams
}

const guessAthleteTeamForYear = (
  year: number,
  athleteTeams: Record<string, { id?: number, name?: string }>,
  athleteUciId: string,
): { id?: number, name?: string } | undefined => {
  const yearSubset = Object.keys(athleteTeams).filter(date => +date.slice(0, 4) === year).reduce((acc, date) => {
    acc[date] = athleteTeams[date]
    return acc
  }, {} as Record<string, { id?: number, name?: string }>)

  const teamsForCurrentYear = Object.keys(yearSubset).map(date => athleteTeams[date])
  const uniqueTeamsForCurrentYear = [...new Set(teamsForCurrentYear.map(team => team.name))]

  if (uniqueTeamsForCurrentYear.length === 0) {
    return
  } else if (uniqueTeamsForCurrentYear.length === 1) {
    // If there's only one unique team for the year, return it
    return teamsForCurrentYear[0]
  } else if (uniqueTeamsForCurrentYear.length > 1) {
    // Get the last two most recent teams based on race dates
    const lastTwoTeams = [
      athleteTeams[Object.keys(athleteTeams).sort().reverse()[0]],
      athleteTeams[Object.keys(athleteTeams).sort().reverse()[0]]
    ]

    // If the athlete has raced for the same team in the last two races of the year, return that team
    if (lastTwoTeams[0].name === lastTwoTeams[1].name) {
      return lastTwoTeams[0]
    } else {
      // Check if the athlete has raced for the same team previously in the year (last team)
      const previousOccurrences = teamsForCurrentYear.filter(team => team.id !== lastTwoTeams[0].id)
      if (previousOccurrences.length >= 2) {
        // If the athlete has raced for the same team previously in the year, return that last team
        return previousOccurrences[0]
      } else {
        // Check if the athlete has raced for the same team previously in the year (2nd last team)
        const previousOccurrences = teamsForCurrentYear.filter(team => team.id !== lastTwoTeams[1].id)
        if (previousOccurrences.length >= 2) {
          // If the athlete has raced for the same team previously in the year, return that before last team
          return previousOccurrences[1]
        }
      }
    }
  }

  logger.warn(`Multiple teams found for athlete in year ${year}: ${uniqueTeamsForCurrentYear.join(', ')}`, {
    athleteUciId,
  })

  console.log(athleteTeams)
}