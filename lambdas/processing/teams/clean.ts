import defaultLogger from '../../shared/logger.ts'
import { SCRIPT_NAME } from '../config.ts'
import type { RawAthleteTeam } from '../types.ts'
import { TeamParser } from '../../shared/team-parser.ts'
import { DEBUG } from '../../shared/config.ts'
import data from '../../shared/data.ts'
import type { Athlete } from '../../shared/types.ts'

const logger = defaultLogger.child({ parser: SCRIPT_NAME })

type PartialTeam = {
  id?: number,
  name?: string,
}

const currentYear = new Date().getFullYear()

export const cleanAthletesTeams = async ({ athleteIds, year }: { athleteIds: string[], year: number }) => {
  await TeamParser.init()

  const [
    allAthletes,
    rawAthletesTeamsForYear,
    rawAthletesTeamsForPreviousYear,
  ] = await Promise.all([
    data.get.baseAthletes(),
    data.get.rawAthletesTeams(year),
    data.get.rawAthletesTeams(year - 1),
  ])

  let updatedAthletes = allAthletes.filter(({ uciId }) => athleteIds.includes(uciId))

  updatedAthletes = updatedAthletes.map((athlete) => {
    const { uciId: athleteUciId } = athlete
    const athleteTeams = {
      ...(rawAthletesTeamsForYear[athleteUciId] || {}),
      ...(rawAthletesTeamsForPreviousYear[athleteUciId] || {}),
    }

    const years = [...new Set(Object.keys(athleteTeams).map(date => +date.slice(0, 4)))]

    if (!years.includes(currentYear)) years.push(currentYear)

    const athleteTeamByYears: Athlete['teams'] = {}

    years.forEach(year => {
      const team = resolveAthleteTeamForYear(year, athleteTeams, athleteUciId)
      if (team) athleteTeamByYears[year] = {
        id: team.id,
        name: team.name
      }
    })

    return {
      ...athlete,
      teams: athleteTeamByYears
    } as Athlete
  })

  logger.info(`Total athletes processed: ${updatedAthletes.length}`)

  try {
    logger.info(`Saving ${updatedAthletes.length} athletes with updated teams`)

    await data.update.baseAthletes(updatedAthletes)
  } catch (error) {
    logger.error(`Failed to save athletes: ${(error as Error).message}`, { error })
  }
}

const resolveAthleteTeamForYear = (
  year: number,
  athleteTeams: RawAthleteTeam,
  athleteUciId: string,
): PartialTeam | undefined => {
  const uniqueTeamsForCurrentYear = getUniqueTeamsForYear(year, athleteTeams)

  if (uniqueTeamsForCurrentYear.length === 0) {
    // If athlete was part of a team in the previous year but not in the current year, assume they stayed in the same team (if only one team in previous year)
    const uniqueTeamsForPreviousYear = getUniqueTeamsForYear(year - 1, athleteTeams)
    if (uniqueTeamsForPreviousYear.length === 1) return uniqueTeamsForPreviousYear[0]

    // Athlete has no team for the year and was not part of a single team in the previous year
    return
  } else if (uniqueTeamsForCurrentYear.length === 1) {
    // If there's only one unique team for the year, return it
    return uniqueTeamsForCurrentYear[0]
  } else if (uniqueTeamsForCurrentYear.length > 1 && Object.keys(athleteTeams).length >= 2) {
    const dates = Object.keys(athleteTeams).sort()
    // Get the last two most recent teams based on race dates
    const lastTwoTeams = [
      athleteTeams[dates.reverse()[0]],
      athleteTeams[dates.sort().reverse()[1]]
    ]

    // If the athlete has raced for the same team in the last two races of the year, return that team
    if (lastTwoTeams[0].name === lastTwoTeams[1].name) {
      return lastTwoTeams[0]
    } else {
      const yearSubset = dates.filter(date => +date.slice(0, 4) === year).reduce((acc, date) => {
        acc[date] = athleteTeams[date]
        return acc
      }, {} as Record<string, { id?: number, name: string }>)

      const teamsForCurrentYear = Object.keys(yearSubset).map(date => athleteTeams[date])

      // Check if the athlete has raced for the same team previously in the year (last team)
      const previousOccurrences = [...teamsForCurrentYear].reverse().filter(team => team.id !== lastTwoTeams[0].id)
      if (previousOccurrences.length >= 2) {
        // If the athlete has raced for the same team previously in the year, return that last team
        return previousOccurrences[0]
      } else {
        // Check if the athlete has raced for the same team previously in the year (2nd last team)
        const previousOccurrences = [...teamsForCurrentYear].reverse().filter(team => team.id !== lastTwoTeams[1].id)
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
}

const getUniqueTeamsForYear = (year: number, athleteTeams: RawAthleteTeam): PartialTeam[] => {
  const dates = Object.keys(athleteTeams)
  const yearSubset = dates.filter(date => +date.slice(0, 4) === year).reduce((acc, date) => {
    acc[date] = athleteTeams[date]
    return acc
  }, {} as Record<string, { id?: number, name: string }>)

  const teamsForYear = Object.keys(yearSubset).map(date => athleteTeams[date])

  return [...new Set(teamsForYear.map(team => team.name))].map(teamName => {
    const team = TeamParser.getTeamByName(teamName)
    return {
      id: team?.id,
      name: teamName,
    }
  })
}