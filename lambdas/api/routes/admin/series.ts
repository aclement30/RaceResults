import type { FastifyPluginAsync } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { nanoid } from 'nanoid'
import data from 'shared/data.ts'
import z from 'zod'
import { BaseCategorySchema } from '../../../../shared/schemas/events.ts'
import {
  BaseSerieEventSchema,
  CreateSerieSchema,
  SerieIndividualEventCategorySchema,
  SerieSchema,
  SerieStandingsSchema,
  UpdateSerieSchema,
} from '../../../../shared/schemas/series.ts'
import { Serie, SerieIndividualEvent, SerieStandings, UpdateSerie } from '../../../../shared/types'
import { ResponseErrorSchema } from '../../types.ts'
import { requireOrganizerAccess } from '../../utils/requireOrganizerAccess'

export const serieRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.withTypeProvider<ZodTypeProvider>().get('/series', {
    preHandler: [fastify.requireRaceDirector, requireOrganizerAccess],
    schema: {
      querystring: z.object({
        year: z.string(),
      }),
      response: {
        200: z.array(SerieSchema),
        403: ResponseErrorSchema,
      },
    },
  }, async (request) => {
    const { year } = request.query

    const filters: { year: number, organizerAlias?: string } = { year: +year }

    if (request.organizerAlias) filters.organizerAlias = request.organizerAlias

    return await data.get.series(filters)
  })

  fastify.withTypeProvider<ZodTypeProvider>().get('/series/:year/:serieHash', {
    preHandler: [fastify.requireRaceDirector, requireOrganizerAccess],
    schema: {
      params: z.object({
        year: z.string(),
        serieHash: z.string(),
      }),
      response: {
        200: SerieSchema,
        403: ResponseErrorSchema,
        404: ResponseErrorSchema,
      },
    },
  }, async (request, response) => {
    const { year, serieHash } = request.params
    const filters: { year: number, serieHash: string, organizerAlias?: string } = { year: +year, serieHash }
    if (request.organizerAlias) filters.organizerAlias = request.organizerAlias

    const [serie] = await data.get.series(filters)

    if (!serie) return response.status(404).send({ error: 'Serie not found' })

    return serie
  })

  fastify.withTypeProvider<ZodTypeProvider>().post('/series', {
    preHandler: [fastify.requireRaceDirector, requireOrganizerAccess],
    schema: {
      body: CreateSerieSchema,
      response: {
        201: SerieSchema,
        400: ResponseErrorSchema,
        403: ResponseErrorSchema,
        404: ResponseErrorSchema,
        500: ResponseErrorSchema,
      },
    },
  }, async (request, response) => {
    const userId = (request.user as any)?.sub ?? 'unknown'
    const { year, name, alias } = request.body

    const existingSeries = await data.get.series({ year })

    // Check if a serie with the same name or alias already exists for the year
    if (existingSeries.some(s => s.name === name)) {
      return response.status(400).send({ error: 'A serie with the same name already exists for ${year}' })
    } else if (existingSeries.some(s => s.alias === alias)) {
      return response.status(400).send({ error: `A serie with the same alias already exists for ${year}` })
    }

    const newSerie = {
      ...request.body,
      hash: nanoid(), // Generate a unique hash for the serie
    } as UpdateSerie

    const { series: [createdSerie], skippedSeries } = await data.update.series([newSerie], {
      year,
      updateSource: 'manual',
      userId,
    })

    if (skippedSeries?.length && skippedSeries.includes(createdSerie.hash)) {
      response.status(500).send({ error: 'Unknown error during serie creation' })
      return
    }

    response.status(201).send(createdSerie)
  })

  fastify.withTypeProvider<ZodTypeProvider>().put('/series/:year/:serieHash', {
    preHandler: [fastify.requireRaceDirector, requireOrganizerAccess],
    schema: {
      params: z.object({
        year: z.string(),
        serieHash: z.string(),
      }),
      body: UpdateSerieSchema,
      response: {
        200: SerieSchema,
        403: ResponseErrorSchema,
        404: ResponseErrorSchema,
      },
    },
  }, async (request, response) => {
    const { year, serieHash } = request.params
    const userId = (request.user as any)?.sub ?? 'unknown'

    const filters: { year: number, serieHash: string, organizerAlias?: string } = { year: +year, serieHash }
    if (request.organizerAlias) filters.organizerAlias = request.organizerAlias

    const [existingSerie] = await data.get.series(filters)

    if (!existingSerie) return response.status(404).send({ error: 'Serie not found' })

    const { series: [updatedSerie] } = await data.update.series(
      [{ ...existingSerie, ...request.body, hash: serieHash }],
      { year: +year, updateSource: 'manual', userId },
    )

    return updatedSerie
  })

  fastify.withTypeProvider<ZodTypeProvider>().patch('/series/:year/:serieHash/:action', {
    preHandler: [fastify.requireRaceDirector, requireOrganizerAccess],
    schema: {
      params: z.object({
        year: z.string(),
        serieHash: z.string(),
        action: z.enum(['lock', 'unlock']),
      }),
      response: {
        204: z.undefined(),
        403: ResponseErrorSchema,
        404: ResponseErrorSchema,
      },
    },
  }, async (request, response) => {
    const { year, serieHash, action } = request.params
    const userId = (request.user as any)?.sub ?? 'unknown'

    const filters: { year: number, serieHash: string, organizerAlias?: string } = { year: +year, serieHash }
    if (request.organizerAlias) filters.organizerAlias = request.organizerAlias

    const [existingSerie] = await data.get.series(filters)

    if (!existingSerie) return response.status(404).send({ error: 'Serie not found' })

    await data.update.series(
      [{ ...existingSerie, userLocked: action === 'lock' } as Serie],
      { year: +year, updateSource: 'manual', userId },
    )

    response.status(204).send()
  })

  fastify.withTypeProvider<ZodTypeProvider>().get('/series/:year/:serieHash/:resultType/events', {
    preHandler: [fastify.requireRaceDirector, requireOrganizerAccess],
    schema: {
      params: z.object({
        year: z.string(),
        serieHash: z.string(),
        resultType: z.enum(['individual', 'team']),
      }),
      response: {
        200: z.array(BaseSerieEventSchema),
        403: ResponseErrorSchema,
        404: ResponseErrorSchema,
      },
    },
  }, async (request, response) => {
    const { year, serieHash, resultType } = request.params
    const filters: { year: number, serieHash: string, organizerAlias?: string } = { year: +year, serieHash }
    if (request.organizerAlias) filters.organizerAlias = request.organizerAlias

    const [serie, serieStandings] = await Promise.all([
      data.get.series(filters),
      data.get.serieStandings(serieHash, +year),
    ])

    if (!serie) return response.status(404).send({ error: 'Serie not found' })
    if (!serieStandings?.[resultType]) return []

    return serieStandings[resultType].events.map(event => ({
      date: event.date,
      published: event.published,
    }))
  })

  fastify.withTypeProvider<ZodTypeProvider>().get('/series/:year/:serieHash/standings', {
    preHandler: [fastify.requireRaceDirector, requireOrganizerAccess],
    schema: {
      params: z.object({
        year: z.string(),
        serieHash: z.string(),
      }),
      response: {
        200: SerieStandingsSchema,
        403: ResponseErrorSchema,
        404: ResponseErrorSchema,
      },
    },
  }, async (request, response) => {
    const { year, serieHash } = request.params
    const filters: { year: number, serieHash: string, organizerAlias?: string } = { year: +year, serieHash }
    if (request.organizerAlias) filters.organizerAlias = request.organizerAlias

    const [serie, serieStandings] = await Promise.all([
      data.get.series(filters),
      data.get.serieStandings(serieHash, +year),
    ])

    if (!serie) return response.status(404).send({ error: 'Serie not found' })

    if (!serieStandings) {
      // If standings are not found, we return an empty standings object.
      // This can happen when a serie is first created and standings have not been uploaded yet.
      return { hash: serieHash, categories: [] }
    }

    return serieStandings
  })

  fastify.withTypeProvider<ZodTypeProvider>().put('/series/:year/:serieHash/standings/categories', {
    preHandler: [fastify.requireRaceDirector, requireOrganizerAccess],
    schema: {
      params: z.object({
        year: z.string(),
        serieHash: z.string(),
      }),
      body: z.array(BaseCategorySchema),
      response: {
        200: z.array(BaseCategorySchema),
        403: ResponseErrorSchema,
        404: ResponseErrorSchema,
      },
    },
  }, async (request, response) => {
    const { year, serieHash } = request.params
    const userId = (request.user as any)?.sub ?? 'unknown'

    const filters: { year: number, serieHash: string, organizerAlias?: string } = { year: +year, serieHash }
    if (request.organizerAlias) filters.organizerAlias = request.organizerAlias

    const [serie, existingStandings] = await Promise.all([
      data.get.series(filters),
      data.get.serieStandings(serieHash, +year),
    ])

    if (!serie) return response.status(404).send({ error: 'Serie not found' })

    const payload: SerieStandings = {
      hash: serieHash,
      categories: request.body,
    }

    const { serieStandings: updated } = await data.update.serieStandings(payload, {
      year: +year,
      updateSource: 'manual',
      userId,
      skipSnapshot: true,
    })

    return updated.categories ?? []
  })

  fastify.withTypeProvider<ZodTypeProvider>().post('/series/:year/:serieHash/standings/individual', {
    preHandler: [fastify.requireRaceDirector, requireOrganizerAccess],
    schema: {
      params: z.object({
        year: z.string(),
        serieHash: z.string(),
      }),
      body: z.object({
        date: z.string(),
      }),
      response: {
        200: BaseSerieEventSchema,
        403: ResponseErrorSchema,
        404: ResponseErrorSchema,
      },
    },
  }, async (request, response) => {
    const { year, serieHash } = request.params
    const { date } = request.body
    const userId = (request.user as any)?.sub ?? 'unknown'

    const filters: { year: number, serieHash: string, organizerAlias?: string } = { year: +year, serieHash }
    if (request.organizerAlias) filters.organizerAlias = request.organizerAlias

    const [serie, existingStandings] = await Promise.all([
      data.get.series(filters),
      data.get.serieStandings(serieHash, +year),
    ])

    if (!serie) return response.status(404).send({ error: 'Serie not found' })

    const existingEvent = existingStandings?.individual?.events.find(e => e.date === date)
    if (existingEvent) {
      return response.status(200).send({ date: existingEvent.date, published: existingEvent.published })
    }

    const payload: SerieStandings = {
      hash: serieHash,
      categories: existingStandings?.categories ?? [],
      individual: {
        events: [{ date, published: false, categories: {} }],
        sourceUrls: existingStandings?.individual?.sourceUrls ?? [],
      },
    }

    await data.update.serieStandings(payload, {
      year: +year,
      updateSource: 'manual',
      userId,
    })

    return { date, published: false }
  })

  fastify.withTypeProvider<ZodTypeProvider>().patch('/series/:year/:serieHash/standings/individual/:date/category/:categoryAlias', {
    preHandler: [fastify.requireRaceDirector, requireOrganizerAccess],
    schema: {
      params: z.object({
        year: z.string(),
        serieHash: z.string(),
        date: z.string(),
        categoryAlias: z.string(),
      }),
      body: SerieIndividualEventCategorySchema,
      response: {
        200: SerieIndividualEventCategorySchema,
        403: ResponseErrorSchema,
        404: ResponseErrorSchema,
      },
    },
  }, async (request, response) => {
    const { year, serieHash, date, categoryAlias } = request.params
    const userId = (request.user as any)?.sub ?? 'unknown'

    const filters: { year: number, serieHash: string, organizerAlias?: string } = { year: +year, serieHash }
    if (request.organizerAlias) filters.organizerAlias = request.organizerAlias

    const [serie, existingResults] = await Promise.all([
      data.get.series(filters),
      data.get.serieStandings(serieHash, +year),
    ])

    if (!serie) return response.status(404).send({ error: 'Serie not found' })

    const incomingEvent: SerieIndividualEvent = {
      date,
      categories: { [categoryAlias]: request.body },
      published: existingResults?.individual?.events.find(e => e.date === date)?.published ?? false,
    }

    const payload: SerieStandings = {
      hash: serieHash,
      categories: existingResults?.categories ?? [],
      individual: {
        events: [incomingEvent],
        sourceUrls: existingResults?.individual?.sourceUrls ?? [],
      },
    }

    const { serieStandings: updated } = await data.update.serieStandings(payload, {
      year: +year,
      updateSource: 'manual',
      userId,
    })

    const updatedCategory = updated.individual?.events.find(e => e.date === date)?.categories[categoryAlias]

    if (!updatedCategory) return response.status(404).send({ error: 'Category not found after update' })

    return updatedCategory
  })

  fastify.withTypeProvider<ZodTypeProvider>().patch('/series/:year/:serieHash/standings/individual/:date/category/:categoryAlias/:locked', {
    preHandler: [fastify.requireRaceDirector, requireOrganizerAccess],
    schema: {
      params: z.object({
        year: z.string(),
        serieHash: z.string(),
        date: z.string(),
        categoryAlias: z.string(),
        locked: z.enum(['lock', 'unlock']),
      }),
      response: {
        204: z.undefined(),
        403: ResponseErrorSchema,
        404: ResponseErrorSchema,
      },
    },
  }, async (request, response) => {
    const { year, serieHash, date, categoryAlias, locked: lockedString } = request.params
    const userLocked = lockedString === 'lock'
    const userId = (request.user as any)?.sub ?? 'unknown'

    const filters: { year: number, serieHash: string, organizerAlias?: string } = { year: +year, serieHash }
    if (request.organizerAlias) filters.organizerAlias = request.organizerAlias

    const [serie, existingResults] = await Promise.all([
      data.get.series(filters),
      data.get.serieStandings(serieHash, +year),
    ])

    if (!serie) return response.status(404).send({ error: 'Serie not found' })

    const existingCategory = existingResults?.individual?.events.find(e => e.date === date)?.categories[categoryAlias]
    if (!existingCategory) return response.status(404).send({ error: 'Category not found' })

    const incomingEvent: SerieIndividualEvent = {
      date,
      categories: { [categoryAlias]: { ...existingCategory, userLocked } },
      published: existingResults?.individual?.events.find(e => e.date === date)?.published ?? false,
    }

    const payload: SerieStandings = {
      hash: serieHash,
      categories: existingResults?.categories ?? [],
      individual: {
        events: [incomingEvent],
        sourceUrls: existingResults?.individual?.sourceUrls ?? [],
      },
    }

    await data.update.serieStandings(payload, {
      year: +year,
      updateSource: 'manual',
      userId,
      skipSnapshot: true,
    })

    response.status(204).send()
  })

  fastify.withTypeProvider<ZodTypeProvider>().delete('/series/:year/:serieHash/standings/individual/:date', {
    preHandler: [fastify.requireRaceDirector, requireOrganizerAccess],
    schema: {
      params: z.object({
        year: z.string(),
        serieHash: z.string(),
        date: z.string(),
      }),
      response: {
        204: z.undefined(),
        403: ResponseErrorSchema,
        404: ResponseErrorSchema,
      },
    },
  }, async (request, response) => {
    const { year, serieHash, date } = request.params

    const filters: { year: number, serieHash: string, organizerAlias?: string } = { year: +year, serieHash }
    if (request.organizerAlias) filters.organizerAlias = request.organizerAlias

    const [serie, existingResults] = await Promise.all([
      data.get.series(filters),
      data.get.serieStandings(serieHash, +year),
    ])

    if (!serie) return response.status(404).send({ error: 'Serie not found' })

    const existingEvent = existingResults?.individual?.events.find(e => e.date === date)
    if (!existingEvent) return response.status(404).send({ error: 'Event not found' })

    await data.delete.serieStandingEvent(serieHash, +year, date)

    response.status(204).send()
  })

  fastify.withTypeProvider<ZodTypeProvider>().patch('/series/:year/:serieHash/standings/individual/:date/:action', {
    preHandler: [fastify.requireRaceDirector, requireOrganizerAccess],
    schema: {
      params: z.object({
        year: z.string(),
        serieHash: z.string(),
        date: z.string(),
        action: z.enum(['publish', 'unpublish']),
      }),
      response: {
        204: z.undefined(),
        403: ResponseErrorSchema,
        404: ResponseErrorSchema,
      },
    },
  }, async (request, response) => {
    const { year, serieHash, date, action } = request.params
    const published = action === 'publish'
    const userId = (request.user as any)?.sub ?? 'unknown'

    const filters: { year: number, serieHash: string, organizerAlias?: string } = { year: +year, serieHash }
    if (request.organizerAlias) filters.organizerAlias = request.organizerAlias

    const [serie, existingResults] = await Promise.all([
      data.get.series(filters),
      data.get.serieStandings(serieHash, +year),
    ])

    if (!serie) return response.status(404).send({ error: 'Serie not found' })

    const existingEvent = existingResults?.individual?.events.find(e => e.date === date)
    if (!existingEvent) return response.status(404).send({ error: 'Event not found' })

    const incomingEvent: SerieIndividualEvent = {
      date,
      published,
      categories: existingEvent.categories,
    }

    const payload: SerieStandings = {
      hash: serieHash,
      categories: existingResults?.categories ?? [],
      individual: {
        events: [incomingEvent],
        sourceUrls: existingResults?.individual?.sourceUrls ?? [],
      },
    }

    await data.update.serieStandings(payload, {
      year: +year,
      updateSource: 'manual',
      userId,
      skipSnapshot: true,
    })

    response.status(204).send()
  })
}
