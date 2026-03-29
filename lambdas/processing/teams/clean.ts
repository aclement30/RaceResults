import { keyBy } from 'lodash-es'
import data from 'shared/data.ts'
import defaultLogger from 'shared/logger.ts'
import { TeamParser } from 'shared/team-parser.ts'
import type { TeamRoster } from 'shared/types.ts'
import { SCRIPT_NAME } from '../config.ts'
import type { RawAthleteTeam } from '../types.ts'

const logger = defaultLogger.child({ parser: SCRIPT_NAME })

type PartialTeam = {
  id?: number,
  name?: string,
}

export const cleanAthletesTeams = async ({ athleteIds, year }: { athleteIds: string[], year: number }) => {
  await TeamParser.init()

  const [
    allAthletes,
    rawAthletesTeamsForYear,
    rawAthletesTeamsForPreviousYear,
    allTeamRosters,
  ] = await Promise.all([
    data.get.athletes(),
    data.get.rawAthletesTeams(year),
    data.get.rawAthletesTeams(year - 1),
    data.get.teamRosters(year),
  ])

  const updatedAthletes = allAthletes.filter(({ uciId }) => athleteIds.includes(uciId))

  const rosterByTeamIds = keyBy(allTeamRosters, 'teamId')
  const updatedTeamIds = new Set<number>()

  updatedAthletes.forEach((athlete) => {
    const { uciId: athleteUciId } = athlete
    const currentTeamId = athlete.teams?.[year]?.id || 0
    const currentTeamRoster = rosterByTeamIds[currentTeamId]

    // Check if athlete has a manually assigned team roster for the current year, if so we should not override their team
    if (currentTeamRoster && currentTeamRoster.athletes.find(athlete => athlete.athleteUciId === athleteUciId)?.source === 'manual') {
      return
    }

    const rawAthleteTeams = {
      ...(rawAthletesTeamsForYear[athleteUciId] || {}),
      ...(rawAthletesTeamsForPreviousYear[athleteUciId] || {}),
    }

    const team = resolveAthleteTeamForYear(year, rawAthleteTeams, athleteUciId)
    if (team?.name && !team.id) {
      logger.warn(`Team "${team.name}" for athlete ${athlete.firstName} ${athlete.lastName} (${athlete.uciId}) in year ${year} could not be matched to an existing team`, {
        athleteUciId,
        teamName: team.name,
      })
    }

    const newTeamId = team?.id || 0

    if (currentTeamId !== newTeamId) {
      logger.info(`Updating team for athlete ${athlete.firstName} ${athlete.lastName} (${athlete.uciId}) for year ${year}: ${currentTeamId} -> ${newTeamId}`)

      // If the athlete was previously assigned to a team, remove them from that team roster
      if (currentTeamRoster && currentTeamRoster.teamId !== newTeamId) {
        currentTeamRoster.athletes = currentTeamRoster.athletes.filter(athlete => athlete.athleteUciId !== athleteUciId)
        updatedTeamIds.add(currentTeamId)
      }

      if (!rosterByTeamIds[newTeamId]) rosterByTeamIds[newTeamId] = { teamId: newTeamId, athletes: [] }

      const newTeamRoster = rosterByTeamIds[newTeamId]
      newTeamRoster.athletes = [
        ...(newTeamRoster.athletes || []).filter(athlete => athlete.athleteUciId !== athleteUciId),
        { athleteUciId, lastUpdated: new Date().toISOString() },
      ]
      updatedTeamIds.add(newTeamId)
    }
  })

  const updatedRosters = Array.from(updatedTeamIds).map(teamId => {
    const roster = rosterByTeamIds[teamId]

    if (!roster) {
      logger.error(`Team roster not found for team ID ${teamId}`)
      return null
    }

    return roster
  }).filter(roster => !!roster) as TeamRoster[]

  logger.info(`Total athletes processed: ${updatedAthletes.length}`)

  try {
    logger.info(`Saving ${updatedRosters.length} updated team rosters`)

    if (updatedRosters.length) {
      await data.update.teamRosters(updatedRosters, year)
    }
  } catch (error) {
    logger.error(`Failed to save team rosters: ${(error as Error).message}`, { error })
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