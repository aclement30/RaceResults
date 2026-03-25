import { diff } from 'deep-object-diff'
import { DEBUG } from 'shared/config.ts'
import data from 'shared/data.ts'
import defaultLogger from 'shared/logger.ts'
import { mergeAthleteChanges } from 'shared/merge-athlete.ts'
import type { Athlete, BaseAthlete } from 'shared/types.ts'
import { SCRIPT_NAME } from '../config.ts'

const logger = defaultLogger.child({ parser: SCRIPT_NAME })

const CURRENT_YEAR = new Date().getFullYear()
const LAST_YEAR = CURRENT_YEAR - 1

export const createViewAthletes = async ({ athleteIds }: {
  athleteIds: string[]
}) => {
  const [
    allBaseAthletes,
    allAthleteManualEdits,
    allTeams,
    currentYearTeamRosters,
    lastYearTeamRosters,
  ] = await Promise.all([
    data.get.baseAthletes(),
    data.get.athleteManualEdits(),
    data.get.teams(),
    data.get.teamRosters(CURRENT_YEAR),
    data.get.teamRosters(LAST_YEAR),
  ])

  const filteredAthletes: BaseAthlete[] = allBaseAthletes
  .filter(({ uciId }) => athleteIds.includes(uciId))

  logger.info(`Updating athletes view for ${athleteIds.length} athletes...`)

  const updatedAthletes: Athlete[] = filteredAthletes.map((baseAthlete) => {
    const athleteUciId = baseAthlete.uciId

    const manualEdit = allAthleteManualEdits.find(edit => edit.uciId === athleteUciId)

    let mergedAthlete: Athlete = {
      ...baseAthlete,
      teams: {},
    }

    if (manualEdit) {
      mergedAthlete = {
        ...mergeAthleteChanges(baseAthlete, manualEdit) as BaseAthlete,
        teams: {}, // Teams will be merged later
      }
      const changedFields = diff(baseAthlete, mergedAthlete)

      if (DEBUG && Object.keys(changedFields).length > 0) {
        logger.info(`Applying manual edit for athlete ${baseAthlete.firstName} ${baseAthlete.lastName} (${athleteUciId}), changed fields: ${Object.keys(changedFields).join(', ')}`)
      }
    }

    // Find current and last year team rosters that include this athlete
    const currentTeamRoster = currentYearTeamRosters.find(roster => roster.athletes.some(a => a.athleteUciId === athleteUciId))
    const lastYearTeamRoster = lastYearTeamRosters.find(roster => roster.athletes.some(a => a.athleteUciId === athleteUciId))

    // If athlete is in a team roster, add team info to the athlete view
    if (currentTeamRoster) {
      const currentTeam = allTeams.find(team => team.id === currentTeamRoster.teamId)

      if (currentTeam) {
        mergedAthlete = {
          ...mergedAthlete,
          teams: {
            ...mergedAthlete.teams,
            [CURRENT_YEAR]: { id: currentTeam.id, name: currentTeam.name },
          }
        }
      } else {
        mergedAthlete = {
          ...mergedAthlete,
          teams: {
            ...mergedAthlete.teams,
            [CURRENT_YEAR]: null, // Team not found / independent
          }
        }
      }
    } else {
      mergedAthlete = {
        ...mergedAthlete,
        teams: {
          ...mergedAthlete.teams,
          [CURRENT_YEAR]: null, // Not in any team roster for current year
        }
      }
    }

    if (lastYearTeamRoster) {
      const lastYearTeam = allTeams.find(team => team.id === lastYearTeamRoster.teamId)

      if (lastYearTeam) {
        mergedAthlete = {
          ...mergedAthlete,
          teams: {
            ...mergedAthlete.teams,
            [LAST_YEAR]: { id: lastYearTeam.id, name: lastYearTeam.name },
          }
        }
      } else {
        mergedAthlete = {
          ...mergedAthlete,
          teams: {
            ...mergedAthlete.teams,
            [LAST_YEAR]: null, // Team not found / independent
          }
        }
      }
    } else {
      mergedAthlete = {
        ...mergedAthlete,
        teams: {
          ...mergedAthlete.teams,
          [LAST_YEAR]: null, // Not in any team roster for last year
        }
      }
    }

    return mergedAthlete
  })

  logger.info(`Saving ${updatedAthletes.length} updated athletes`)

  const { validationErrors } = await data.update.athletes(updatedAthletes)

  if (validationErrors && Object.keys(validationErrors).length > 0) {
    logger.error(`Validation errors for ${Object.keys(validationErrors).length} athletes:`, { validationErrors })
  }

  return updatedAthletes
}
