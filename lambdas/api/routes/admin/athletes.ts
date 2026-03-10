import type { FastifyReply, FastifyRequest } from 'fastify'
import data from '../../../shared/data.ts'
import { calculateRequiredManualEdits, mergeAthleteChanges } from '../../../shared/merge-athlete.ts'
import type { Athlete } from '../../../../src/types/athletes.ts'
import type { TeamRoster } from '../../../../src/types/team.ts'
import { createViewAthletes } from '../../../processing/views/athletes.ts'

const CURRENT_YEAR = new Date().getFullYear()

export type PutAthleteRequestBody = Partial<Omit<Athlete, 'uciId' | 'lastUpdated'>>

export const GetAthletesRoute = async () => {
  return data.get.athletes()
}

export const GetAthleteRoute = async (
  request: FastifyRequest<{ Params: { athleteUciId: string } }>,
  response: FastifyReply
) => {
  const { athleteUciId } = request.params

  if (!athleteUciId) {
    response.status(400).send({ error: 'Invalid query: `athleteUciId` is missing' })
    return
  }

  const athlete = await data.get.athletes(athleteUciId)

  if (!athlete) {
    response.status(404).send({ error: `Athlete with id ${athleteUciId} not found` })
    return
  }

  return athlete
}

export const PutAthleteRoute = async (request: FastifyRequest, response: FastifyReply) => {
  const { athleteUciId } = request.params as { athleteUciId: string }
  const { teams, ...updatedFields } = request.body as PutAthleteRequestBody

  if (!athleteUciId) {
    response.status(400).send({ error: 'Invalid query: `athleteUciId` is missing' })
    return
  }

  const [
    existingAthleteWithTeam,  // Need to check if team has changed
    baseAthlete,
    existingManualEdits
  ] = await Promise.all([
    data.get.athletes(athleteUciId),
    data.get.baseAthletes(athleteUciId),
    data.get.athleteManualEdits(athleteUciId),
  ])

  if (!baseAthlete) {
    response.status(404).send({ error: `Athlete with id ${athleteUciId} not found` })
    return
  }

  // Merge existing manual edits with updated fields
  const newManualEdits = mergeAthleteChanges(existingManualEdits || {}, updatedFields)

  // Get final merged athlete data after applying the new manual edits on top of base athlete
  const targetAthlete = mergeAthleteChanges(baseAthlete, newManualEdits) as Athlete

  // Calculate clean manual edits (remove fields that now match base)
  const cleanedManualEdits = calculateRequiredManualEdits(baseAthlete, targetAthlete)

  await data.update.athleteManualEdits([
    {
      ...cleanedManualEdits,
      uciId: athleteUciId,
    }
  ])

  // Check if teams have changed compared to current athlete data, if so we need to update team rosters accordingly
  if (JSON.stringify(existingAthleteWithTeam.teams?.[CURRENT_YEAR]) !== JSON.stringify(teams?.[CURRENT_YEAR])) {
    const allTeamRosters = await data.get.teamRosters(CURRENT_YEAR)
    const updatedRosters: TeamRoster[] = []

    // Remove athlete from their current team
    const previousTeamId = existingAthleteWithTeam.teams?.[CURRENT_YEAR]?.id || 0 // Default to 0 (independent) if not in a team
    const previousTeamRoster = allTeamRosters.find(r => r.teamId === previousTeamId)
    if (previousTeamRoster) {
      updatedRosters.push({
        ...previousTeamRoster,
        athletes: previousTeamRoster.athletes.filter(a => a.athleteUciId !== athleteUciId)
      })
    }

    // Add athlete to their new team
    let newTeamId = 0 // Default: independent
    if (teams?.[CURRENT_YEAR]?.id) newTeamId = teams[CURRENT_YEAR].id
    const newTeamRoster = allTeamRosters.find(r => r.teamId === newTeamId) || { teamId: newTeamId, athletes: [] }
    updatedRosters.push({
      ...newTeamRoster,
      athletes: [
        ...newTeamRoster.athletes.filter(a => a.athleteUciId !== athleteUciId), // Remove athlete if already exists to avoid duplicates
        {
          athleteUciId,
          source: 'manual',
          lastUpdated: new Date().toISOString(),
        }
      ],
    })

    console.log({ updatedRosters })
    await data.update.teamRosters(updatedRosters, CURRENT_YEAR)
  }

  // Rebuild athletes view to apply manual edits & team changes
  const [updatedAthlete] = await createViewAthletes({ athleteIds: [athleteUciId] })

  return updatedAthlete
}
