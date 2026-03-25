import type { FastifyPluginAsync } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import data from 'shared/data.ts'
import z from 'zod'
import { SerieSchema } from '../../../../shared/schemas/series.ts'

export const serieRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.withTypeProvider<ZodTypeProvider>().get('/series', {
    preHandler: [fastify.requireRaceDirector],
    schema: {
      querystring: z.object({
        year: z.string(),
      }),
      response: {
        200: z.array(SerieSchema),
      },
    },
  }, async (request, response) => {
    const { year } = request.query

    return await data.get.series({ year: +year })
  })
}