import type { FastifyPluginAsync } from 'fastify'
import type { Athlete, Team, TeamRoster } from '../../shared/types.ts'
import { GetAthleteRoute, GetAthletesRoute, type PutAthleteRequestBody, PutAthleteRoute } from './admin/athletes.ts'
import {
  DeleteTeamRoute,
  GetTeamRostersRoute,
  GetTeamsRoute,
  PostTeamRoute,
  type PutTeamRosterRequestBody,
  PutTeamRosterRoute,
  PutTeamRoute,
  RestoreTeamRoute
} from './admin/teams.ts'
import { GetConfigurationFileRoute, PutConfigurationFileRoute } from './admin/settings.ts'
// import { GetLambdaProcessingLatestRunsRoute } from './admin/lambdas.ts'

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
  fastify.post<{ Body: Omit<Team, 'id'> }>('/teams', PostTeamRoute)
  fastify.put<{ Params: { teamId: string }; Body: Team }>('/teams/:teamId', PutTeamRoute)
  fastify.delete<{ Params: { teamId: string } }>('/teams/:teamId', DeleteTeamRoute)
  fastify.patch<{ Params: { teamId: string } }>('/teams/:teamId/restore', RestoreTeamRoute)
  fastify.get<{ Query: { year: string }; Reply: TeamRoster[] }>('/teams/rosters', GetTeamRostersRoute)
  fastify.put<{
    Params: { teamId: string };
    Body: PutTeamRosterRequestBody
  }>('/teams/:teamId/roster', PutTeamRosterRoute)
  // fastify.get<{}>('/lambdas/processing/latest-runs', GetLambdaProcessingLatestRunsRoute)
  fastify.get<{
    Params: { filename: string };
    Reply: any
  }>('/settings/config-files/:filename', GetConfigurationFileRoute)
  fastify.put<{
    Params: { filename: string };
    Body: any
  }>('/settings/config-files/:filename', PutConfigurationFileRoute)
}
