import { diff } from 'deep-object-diff'
import defaultLogger from '../../shared/logger.ts'
import { SCRIPT_NAME } from '../config.ts'
import { DEBUG } from '../../shared/config.ts'
import data from '../../shared/data.ts'
import { mergeAthleteChanges } from '../../shared/merge-athlete.ts'
import type { Athlete } from '../../shared/types.ts'

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

  let updatedAthletes = allBaseAthletes
  .filter(({ uciId }) => athleteIds.includes(uciId))

  logger.info(`Updating athletes view for ${athleteIds.length} athletes...`)

  updatedAthletes = updatedAthletes.map((baseAthlete) => {
    let athleteUciId = baseAthlete.uciId

    const manualEdit = allAthleteManualEdits.find(edit => edit.uciId === athleteUciId)

    let mergedAthlete = baseAthlete

    if (manualEdit) {
      mergedAthlete = mergeAthleteChanges(baseAthlete, manualEdit) as Athlete
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
      const currentTeam = allTeams.find(team => team.id === lastYearTeamRoster.teamId)

      if (currentTeam) {
        mergedAthlete = {
          ...mergedAthlete,
          teams: {
            ...mergedAthlete.teams,
            [LAST_YEAR]: { id: currentTeam.id, name: currentTeam.name },
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

  await data.update.athletes(updatedAthletes)

  return updatedAthletes
}
