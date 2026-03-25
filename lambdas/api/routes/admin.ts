import type { FastifyPluginAsync } from 'fastify'
import { athleteRoutes } from './admin/athletes.ts'
import { eventRoutes } from './admin/events.ts'
import { organizerRoutes } from './admin/organizers.ts'
import { serieRoutes } from './admin/series.ts'
import { settingRoutes } from './admin/settings.ts'
import { teamRoutes } from './admin/teams.ts'
import { userRoutes } from './admin/users.ts'

export const adminRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.register(athleteRoutes)
  fastify.register(eventRoutes)
  fastify.register(organizerRoutes)
  fastify.register(serieRoutes)
  fastify.register(settingRoutes)
  fastify.register(teamRoutes)
  fastify.register(userRoutes)
}
