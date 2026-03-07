import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify'
import data, { DataError, DataErrorCode } from '../../shared/data.ts'
import type { Athlete, Team } from '../../shared/types.ts'
import { createViewAthletes } from '../../processing/views/athletes.ts'
import { omit } from 'lodash-es'
import type { TeamRoster } from '../../../src/types/team.ts'
import { calculateRequiredManualEdits, mergeAthleteChanges } from '../../shared/merge-athlete.ts'

type PutAthleteRequestBody = Partial<Omit<Athlete, 'uciId' | 'lastUpdated'>>
type PutTeamRosterRequestBody = { athletes: { athleteUciId: string }[] }

export const adminRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', fastify.requireAdmin)

  // Athletes
  fastify.get<{ Reply: Athlete[] }>('/athletes', GetAthletesRoute)
  fastify.get<{
    Params: { athleteUciId: string };
    Reply: Athlete
  }>('/athletes/:athleteUciId', GetAthleteRoute)
  fastify.put<{
    Params: { athleteUciId: string };
    Body: PutAthleteRequestBody
    Reply: Athlete
  }>('/athletes/:athleteUciId', PutAthleteRoute)
  // Teams
  fastify.get<{ Reply: Team[] }>('/teams', GetTeamsRoute)
  fastify.put<{ Params: { teamId: string }; Body: Team }>('/teams/:teamId', PutTeamRoute)
  fastify.delete<{ Params: { teamId: string } }>('/teams/:teamId', DeleteTeamRoute)
  fastify.patch<{ Params: { teamId: string } }>('/teams/:teamId/restore', RestoreTeamRoute)
  fastify.get<{ Query: { year: string }; Reply: TeamRoster[] }>('/teams/rosters', GetTeamRostersRoute)
  fastify.put<{
    Params: { teamId: string };
    Body: PutTeamRosterRequestBody
  }>('/teams/:teamId/roster', PutTeamRosterRoute)
}

const CURRENT_YEAR = new Date().getFullYear()

const GetAthletesRoute = async () => {
  return data.get.athletes()
}

const GetAthleteRoute = async (
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

const PutAthleteRoute = async (request: FastifyRequest, response: FastifyReply) => {
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

const GetTeamsRoute = async () => {
  return data.get.teams()
}

const PutTeamRoute = async (request: FastifyRequest, response: FastifyReply) => {
  const { teamId } = request.params as { teamId: string }
  const team = omit(request.body as Team, 'id')

  if (!teamId) {
    response.status(400).send({ error: 'Invalid query: `teamId` is missing' })
    return
  }

  const existingTeam = await data.get.teams().then(teams => teams.find(t => t.id === +teamId))

  await data.update.team({
    id: +teamId,
    ...team,
  })

  // If team name has changed, we need to rebuild athletes view to reflect the changes in athletes' teams
  if (existingTeam?.name !== team.name) {
    const teamRoster = await data.get.teamRosters(CURRENT_YEAR).then(rosters => rosters.find(r => r.teamId === +teamId))
    const athleteUciIds = teamRoster?.athletes.map(a => a.athleteUciId) || []

    await createViewAthletes({ athleteIds: athleteUciIds })
  }

  response.status(204).send()
}

const DeleteTeamRoute = async (request: FastifyRequest, response: FastifyReply) => {
  const { teamId } = request.params as { teamId: string }

  if (!teamId) {
    response.status(400).send({ error: 'Invalid query: `teamId` is missing' })
    return
  }

  try {
    await data.delete.team(+teamId)
  } catch (err) {
    if (err instanceof DataError && err.code === DataErrorCode.ENTITY_NOT_FOUND) {
      response.status(404).send({ error: err.message })
      return
    } else {
      throw err
    }
  }

  response.status(204).send()
}

const RestoreTeamRoute = async (request: FastifyRequest, response: FastifyReply) => {
  const { teamId } = request.params as { teamId: string }

  if (!teamId) {
    response.status(400).send({ error: 'Invalid query: `teamId` is missing' })
    return
  }

  try {
    await data.restore.team(+teamId)
  } catch (err) {
    if (err instanceof DataError && err.code === DataErrorCode.ENTITY_NOT_FOUND) {
      response.status(404).send({ error: err.message })
      return
    } else {
      throw err
    }
  }

  response.status(204).send()
}

const GetTeamRostersRoute = async (request: FastifyRequest, response: FastifyReply) => {
  let { year } = request.query as { year: string }

  // If no year provided, default to current year
  if (!year) year = CURRENT_YEAR.toString()

  // Validate year format (should be a 4-digit number)
  if (!/^\d{4}$/.test(year)) {
    response.status(404).send({ error: 'Invalid query parameter: `year`' })
    return
  }

  return data.get.teamRosters(year)
}

const PutTeamRosterRoute = async (request: FastifyRequest, response: FastifyReply) => {
  const { teamId } = request.params as { teamId: string }
  const teamRoster = request.body as PutTeamRosterRequestBody

  if (!teamId) {
    response.status(400).send({ error: 'Invalid query: `teamId` is missing' })
    return
  } else if (!teamRoster.athletes || !Array.isArray(teamRoster.athletes)) {
    response.status(400).send({ error: 'Invalid query: `athletes` must be an array' })
    return
  }

  const existingTeamRosters = await data.get.teamRosters(CURRENT_YEAR)

  const existingTeamRoster = existingTeamRosters.find(r => r.teamId === +teamId)
  if (!existingTeamRoster) {
    response.status(404).send({ error: `Team roster for teamId ${teamId} not found` })
    return
  }

  // Find athletes that are being moved from other teams to this team
  // Athletes can only be on one team per year, so we need to remove them from their current team
  const conflictingAthletes: Array<{ athleteUciId: string; currentTeamId: number }> = []
  const updatedRosters: TeamRoster[] = []

  for (const newAthlete of teamRoster.athletes) {
    // Check if this athlete is currently on another team
    const currentTeamRoster = existingTeamRosters.find(roster =>
      roster.teamId !== +teamId &&
      roster.athletes.some(a => a.athleteUciId === newAthlete.athleteUciId)
    )

    if (currentTeamRoster) {
      conflictingAthletes.push({
        athleteUciId: newAthlete.athleteUciId,
        currentTeamId: currentTeamRoster.teamId
      })

      // Remove athlete from their current team
      const updatedCurrentRoster = updatedRosters.find(r => r.teamId === currentTeamRoster.teamId) || {
        teamId: currentTeamRoster.teamId,
        athletes: currentTeamRoster.athletes.filter(a => a.athleteUciId !== newAthlete.athleteUciId)
      }

      // Update or add the modified roster
      const existingIndex = updatedRosters.findIndex(r => r.teamId === currentTeamRoster.teamId)
      if (existingIndex >= 0) {
        updatedRosters[existingIndex] = updatedCurrentRoster
      } else {
        updatedRosters.push(updatedCurrentRoster)
      }
    }
  }

  // Add the target team roster (with new athletes)
  updatedRosters.push({
    teamId: +teamId,
    athletes: teamRoster.athletes.map(a => ({
      athleteUciId: a.athleteUciId,
      source: 'manual',
      lastUpdated: new Date().toISOString(),
    })),
  })

  // Update all affected team rosters in a single operation
  await data.update.teamRosters(updatedRosters, CURRENT_YEAR)

  // Log the changes for debugging/audit
  if (conflictingAthletes.length > 0) {
    console.log(`🔄 Moved ${conflictingAthletes.length} athletes to team ${teamId}:`)
    conflictingAthletes.forEach(({ athleteUciId, currentTeamId }) => {
      console.log(`  - Athlete ${athleteUciId}: Team ${currentTeamId} → Team ${teamId}`)
    })
  }

  // Rebuild athletes view to apply the team roster changes in athletes' teams
  const athleteUciIds = teamRoster.athletes.map(a => a.athleteUciId)
  await createViewAthletes({ athleteIds: athleteUciIds })

  response.status(204).send()
}