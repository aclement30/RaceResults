import type { FastifyPluginAsync } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import data from 'shared/data.ts'
import { calculateRequiredManualEdits, mergeAthleteChanges } from 'shared/merge-athlete'
import type { Athlete, TeamRoster } from 'shared/types.ts'
import z from 'zod'
import { AthleteSchema, UpdateAthleteSchema } from '../../../../shared/schemas/athletes.ts'
import { createViewAthletes } from '../../../processing/views/athletes.ts'

const CURRENT_YEAR = new Date().getFullYear()

export const athleteRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.withTypeProvider<ZodTypeProvider>().get('/athletes', {
    preHandler: [fastify.requireRaceDirector],
    schema: {
      response: {
        200: z.array(AthleteSchema),
      },
    }
  }, async () => data.get.athletes())

  fastify.withTypeProvider<ZodTypeProvider>().get('/athletes/:athleteUciId', {
    preHandler: [fastify.requireRaceDirector],
    schema: {
      params: z.object({
        athleteUciId: z.string(),
      }),
      response: {
        200: AthleteSchema,
        404: z.object({ error: z.string() }),
      },
    }
  }, async (request, response) => {
    const { athleteUciId } = request.params

    const athlete = await data.get.athletes(athleteUciId)

    if (!athlete) {
      response.status(404).send({ error: `Athlete with id ${athleteUciId} not found` })
      return
    }

    return athlete
  })

  fastify.withTypeProvider<ZodTypeProvider>().get('/athletes/lookup-table', {
    preHandler: [fastify.requireRaceDirector],
    schema: {
      response: {
        200: z.record(z.string(), z.string()),
      },
    }
  }, async () => data.get.athletesLookup())

  fastify.withTypeProvider<ZodTypeProvider>().put('/athletes/:athleteUciId', {
    preHandler: [fastify.requireSuperAdmin],
    schema: {
      params: z.object({
        athleteUciId: z.string(),
      }),
      body: UpdateAthleteSchema,
      response: {
        200: AthleteSchema,
        404: z.object({ error: z.string() }),
      },
    }
  }, async (request, response) => {
    const { athleteUciId } = request.params as { athleteUciId: string }
    const { teams, ...updatedFields } = request.body

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

    await data.update.athleteManualEdit({
      ...cleanedManualEdits,
      uciId: athleteUciId,
    })

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

      await data.update.teamRosters(updatedRosters, CURRENT_YEAR)
    }

    // Rebuild athletes view to apply manual edits & team changes
    const [updatedAthlete] = await createViewAthletes({ athleteIds: [athleteUciId] })

    return updatedAthlete
  })
}
