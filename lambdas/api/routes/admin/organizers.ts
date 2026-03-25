import type { FastifyPluginAsync } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import data from 'shared/data.ts'
import z from 'zod'
import { OrganizerSchema } from '../../../../shared/schemas/organizers.ts'

export const organizerRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.withTypeProvider<ZodTypeProvider>().get('/organizers', {
    preHandler: [fastify.requireRaceDirector],
    schema: {
      response: {
        200: z.array(OrganizerSchema),
      },
    },
  }, async () => data.get.organizers())
}
