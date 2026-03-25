import type { FastifyPluginAsync } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { omit } from 'lodash-es'
import { nanoid } from 'nanoid'

import data from 'shared/data.ts'
import { publishRaceEventChange } from 'shared/aws-sns.ts'
import type {
  CreateEvent,
  CreateEventCategory,
  CreateEventResults,
  EventCategory,
  RaceEvent,
  UpdateEvent
} from 'shared/types.ts'
import z from 'zod'
import {
  BaseCategorySchema,
  CreateEventCategorySchema,
  CreateEventSchema,
  EventCategorySchema,
  EventResultsSchema,
  RaceEventSchema,
  UpdateEventSchema
} from '../../../../shared/schemas/events.ts'
import { isSuperAdmin } from '../../utils/isSuperAdmin.ts'

export const eventRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.withTypeProvider<ZodTypeProvider>().get('/events', {
    preHandler: [fastify.requireRaceDirector],
    schema: {
      querystring: z.object({
        year: z.string(),
      }),
      response: {
        200: z.array(RaceEventSchema),
        403: z.object({ error: z.string() }),
      },
    },
  }, async (request, response) => {
    const { year } = request.query

    const organizerAlias = request.user?.['custom:organizer_alias']
    if (!organizerAlias && !isSuperAdmin(request)) {
      response.status(403).send({ error: 'Access denied. Organizer alias required for non-superadmin users.' })
    }

    const filters: { year: number, organizerAlias?: string } = { year: +year }

    if (!isSuperAdmin(request) && organizerAlias) filters.organizerAlias = organizerAlias

    const events = await data.get.events(filters, { summary: false }) as RaceEvent[]

    return events
  })

  fastify.withTypeProvider<ZodTypeProvider>().get('/events/:year/:eventHash', {
    preHandler: [fastify.requireRaceDirector],
    schema: {
      params: z.object({
        year: z.string(),
        eventHash: z.string()
      }),
      response: {
        200: RaceEventSchema,
        403: z.object({ error: z.string() }),
        404: z.object({ error: z.string() }),
      },
    },
  }, async (request, response) => {
    const { year, eventHash } = request.params

    const organizerAlias = request.user?.['custom:organizer_alias']
    if (!organizerAlias && !isSuperAdmin(request)) {
      response.status(403).send({ error: 'Access denied. Organizer alias required for non-superadmin users.' })
    }

    const filters: { year: number, eventHash: string, organizerAlias?: string } = { year: +year, eventHash }

    if (!isSuperAdmin(request) && organizerAlias) filters.organizerAlias = organizerAlias

    const [event] = await data.get.events(filters, { summary: false }) as RaceEvent[]

    if (!event) {
      response.status(404).send({ error: 'Event not found' })
      return
    }

    return event
  })

  fastify.withTypeProvider<ZodTypeProvider>().get('/events/:year/:eventHash/results', {
    preHandler: [fastify.requireRaceDirector],
    schema: {
      params: z.object({
        year: z.string(),
        eventHash: z.string()
      }),
      response: {
        200: EventResultsSchema,
        403: z.object({ error: z.string() }),
        404: z.object({ error: z.string() }),
      },
    },
  }, async (request, response) => {
    const { year, eventHash } = request.params

    const organizerAlias = request.user?.['custom:organizer_alias']
    if (!organizerAlias && !isSuperAdmin(request)) {
      response.status(403).send({ error: 'Access denied. Organizer alias required for non-superadmin users.' })
    }

    const filters: { year: number, eventHash: string, organizerAlias?: string } = { year: +year, eventHash }

    if (!isSuperAdmin(request) && organizerAlias) filters.organizerAlias = organizerAlias

    const [event, eventResults] = await Promise.all([
      // We need to fetch the event again to check if it exists and the user has access to it
      data.get.events(filters, { summary: true }),
      data.get.eventResults(eventHash, +year),
    ])

    if (!event) {
      response.status(404).send({ error: 'Event not found' })
      return
    }
    if (!eventResults) {
      // If results are not found, we return an empty results object.
      // This can happen when an event is first created and results have not been uploaded yet.
      return {
        hash: eventHash,
        categories: [],
      }
    }

    return eventResults
  })

  fastify.withTypeProvider<ZodTypeProvider>().post('/events/:year/:eventHash/results/category', {
    preHandler: [fastify.requireRaceDirector],
    schema: {
      params: z.object({
        year: z.string(),
        eventHash: z.string(),
      }),
      body: BaseCategorySchema,
      response: {
        201: EventCategorySchema,
        400: z.object({ error: z.string() }),
        403: z.object({ error: z.string() }),
        404: z.object({ error: z.string() }),
      },
    },
  }, async (request, response) => {
    const { year, eventHash } = request.params
    const categoryData = omit(request.body, ['createdAt', 'updatedAt'])

    const organizerAlias = request.user?.['custom:organizer_alias']
    if (!organizerAlias && !isSuperAdmin(request)) {
      response.status(403).send({ error: 'Access denied. Organizer alias required for non-superadmin users.' })
    }

    const filters: { year: number, eventHash: string, organizerAlias?: string } = { year: +year, eventHash }

    if (!isSuperAdmin(request) && organizerAlias) filters.organizerAlias = organizerAlias

    const [
      [existingEvent],
      existingEventResult,
    ] = await Promise.all([
      data.get.events(filters, { summary: false }),
      data.get.eventResults(eventHash, +year)!
    ])

    if (!existingEvent) {
      response.status(404).send({ error: 'Event not found' })
      return
    }

    const updatedCategories = (existingEventResult?.categories || []) as CreateEventCategory[]

    // Add missing fields for new category
    const newCategoryData: CreateEventCategory = {
      ...categoryData,
      results: [],
      primes: [],
      upgradePoints: null,
      starters: 0,
      finishers: 0,
    }

    // Return 400 if a category with the same alias already exists
    const categoryExists = updatedCategories.some(c => c.alias === categoryData.alias)
    if (categoryExists) {
      response.status(400).send({ error: 'A category with this alias already exists in the results for this event' })
      return
    }

    updatedCategories.push(newCategoryData)

    const updatedResult: CreateEventResults = {
      hash: eventHash,
      ...existingEventResult,
      categories: updatedCategories,
    }

    const savedResult = await data.update.eventResults(updatedResult, {
      year: +year, updateSource: 'manual', userId: request.user!.sub,
    })

    const savedCategory = savedResult.categories.find(c => c.alias === categoryData.alias)!

    await publishRaceEventChange({ year: +year, eventHashes: [eventHash] })

    response.status(201).send(savedCategory)
  })

  fastify.withTypeProvider<ZodTypeProvider>().patch('/events/:year/:eventHash/results/category/:categoryAlias', {
    preHandler: [fastify.requireRaceDirector],
    schema: {
      params: z.object({
        year: z.string(),
        eventHash: z.string(),
        categoryAlias: z.string(),
      }),
      body: CreateEventCategorySchema,
      response: {
        200: EventCategorySchema,
        400: z.object({ error: z.string() }),
        403: z.object({ error: z.string() }),
        404: z.object({ error: z.string() }),
      },
    },
  }, async (request, response) => {
    const { year, eventHash } = request.params
    const categoryData = omit(request.body, ['createdAt', 'updatedAt'])

    const organizerAlias = request.user?.['custom:organizer_alias']
    if (!organizerAlias && !isSuperAdmin(request)) {
      response.status(403).send({ error: 'Access denied. Organizer alias required for non-superadmin users.' })
    }

    const filters: { year: number, eventHash: string, organizerAlias?: string } = { year: +year, eventHash }

    if (!isSuperAdmin(request) && organizerAlias) filters.organizerAlias = organizerAlias

    const [
      [existingEvent],
      existingEventResult,
    ] = await Promise.all([
      data.get.events(filters, { summary: false }),
      data.get.eventResults(eventHash, +year)!
    ])

    if (!existingEvent) {
      response.status(404).send({ error: 'Event not found' })
      return
    }

    const updatedCategories = (existingEventResult?.categories || []) as CreateEventCategory[]

    const { categoryAlias } = request.params

    // Ensure the category being updated exists
    const categoryIdx = updatedCategories.findIndex(c => c.alias === categoryAlias)
    if (categoryIdx === -1) {
      response.status(404).send({ error: 'Category not found' })
      return
    }

    // If alias is changing, ensure the new alias doesn't conflict with another category
    if (categoryData.alias !== categoryAlias && updatedCategories.some(c => c.alias === categoryData.alias)) {
      response.status(400).send({ error: 'Another category with this alias already exists in the results for this event' })
      return
    }

    updatedCategories[categoryIdx] = categoryData

    const updatedResult: CreateEventResults = {
      hash: eventHash,
      ...existingEventResult,
      categories: updatedCategories,
    }

    const savedResult = await data.update.eventResults(updatedResult, {
      year: +year, updateSource: 'manual', userId: request.user!.sub,
    })

    const savedCategory = savedResult.categories.find(c => c.alias === categoryData.alias)!

    await publishRaceEventChange({ year: +year, eventHashes: [eventHash] })

    response.status(200).send(savedCategory)
  })

  fastify.withTypeProvider<ZodTypeProvider>().patch('/events/:year/:eventHash/results/categories/order', {
    preHandler: [fastify.requireRaceDirector],
    schema: {
      params: z.object({
        year: z.string(),
        eventHash: z.string(),
      }),
      body: z.object({ aliases: z.array(z.string()) }),
      response: {
        204: z.undefined(),
        400: z.object({ error: z.string() }),
        403: z.object({ error: z.string() }),
        404: z.object({ error: z.string() }),
      },
    },
  }, async (request, response) => {
    const { year, eventHash } = request.params
    const { aliases } = request.body

    const organizerAlias = request.user?.['custom:organizer_alias']
    if (!organizerAlias && !isSuperAdmin(request)) {
      response.status(403).send({ error: 'Access denied. Organizer alias required for non-superadmin users.' })
      return
    }

    const filters: { year: number, eventHash: string, organizerAlias?: string } = { year: +year, eventHash }
    if (!isSuperAdmin(request) && organizerAlias) filters.organizerAlias = organizerAlias

    const [[existingEvent], existingEventResult] = await Promise.all([
      data.get.events(filters, { summary: false }),
      data.get.eventResults(eventHash, +year),
    ])

    if (!existingEvent) {
      response.status(404).send({ error: 'Event not found' })
      return
    }

    const existingCategories = (existingEventResult?.categories ?? []) as CreateEventCategory[]
    const existingAliases = new Set(existingCategories.map(c => c.alias))

    if (aliases.length !== existingCategories.length || aliases.some(a => !existingAliases.has(a))) {
      response.status(400).send({ error: 'Aliases must match the existing categories exactly' })
      return
    }

    const categoryByAlias = new Map(existingCategories.map(c => [c.alias, c]))
    const reorderedCategories = aliases.map(a => categoryByAlias.get(a)!)

    await data.update.eventResults({
      hash: eventHash,
      ...existingEventResult,
      categories: reorderedCategories,
    }, { year: +year, updateSource: 'manual', userId: request.user!.sub })

    response.status(204).send()
  })

  fastify.withTypeProvider<ZodTypeProvider>().patch('/events/:year/:eventHash/results/category/:categoryAlias/:locked', {
    preHandler: [fastify.requireRaceDirector],
    schema: {
      params: z.object({
        year: z.string(),
        eventHash: z.string(),
        categoryAlias: z.string(),
        locked: z.enum(['lock', 'unlock']),
      }),
      response: {
        204: z.undefined(),
        403: z.object({ error: z.string() }),
        404: z.object({ error: z.string() }),
      },
    },
  }, async (request, response) => {
    const { year, eventHash, categoryAlias, locked: lockedString } = request.params
    const userLocked = lockedString === 'lock'

    const organizerAlias = request.user?.['custom:organizer_alias']
    if (!organizerAlias && !isSuperAdmin(request)) {
      response.status(403).send({ error: 'Access denied. Organizer alias required for non-superadmin users.' })
    }

    const filters: { year: number, eventHash: string, organizerAlias?: string } = { year: +year, eventHash }

    if (!isSuperAdmin(request) && organizerAlias) filters.organizerAlias = organizerAlias

    const [
      [existingEvent],
      existingEventResult,
    ] = await Promise.all([
      data.get.events(filters, { summary: false }),
      data.get.eventResults(eventHash, +year)!
    ])

    if (!existingEvent) {
      response.status(404).send({ error: 'Event not found' })
      return
    }

    const updatedCategories = (existingEventResult?.categories || []) as EventCategory[]

    // Replace the category in the existing results
    const existingCategory = updatedCategories.find(c => c.alias === categoryAlias)
    if (!existingCategory) {
      response.status(404).send({ error: 'Category not found in event results' })
      return
    }

    const catIdx = updatedCategories.findIndex(c => c.alias === categoryAlias)

    updatedCategories[catIdx] = {
      ...existingCategory,
      userLocked,
    }

    const updatedResult: CreateEventResults = {
      hash: eventHash,
      ...existingEventResult,
      categories: updatedCategories,
    }

    await data.update.eventResults(updatedResult, {
      year: +year, updateSource: 'manual', userId: request.user!.sub, skipSnapshot: true,
    })

    response.status(204).send()
  })

  fastify.withTypeProvider<ZodTypeProvider>().delete('/events/:year/:eventHash/results/category/:categoryAlias', {
    preHandler: [fastify.requireRaceDirector],
    schema: {
      params: z.object({
        year: z.string(),
        eventHash: z.string(),
        categoryAlias: z.string(),
      }),
      response: {
        204: z.undefined(),
        403: z.object({ error: z.string() }),
        404: z.object({ error: z.string() }),
      },
    },
  }, async (request, response) => {
    const { year, eventHash, categoryAlias } = request.params

    const organizerAlias = request.user?.['custom:organizer_alias']
    if (!organizerAlias && !isSuperAdmin(request)) {
      response.status(403).send({ error: 'Access denied. Organizer alias required for non-superadmin users.' })
    }

    const filters: { year: number, eventHash: string, organizerAlias?: string } = { year: +year, eventHash }

    if (!isSuperAdmin(request) && organizerAlias) filters.organizerAlias = organizerAlias

    const [
      [existingEvent],
      existingEventResult,
    ] = await Promise.all([
      data.get.events(filters, { summary: false }),
      data.get.eventResults(eventHash, +year)!
    ])

    if (!existingEvent) {
      response.status(404).send({ error: 'Event not found' })
      return
    }

    const updatedCategories = (existingEventResult?.categories || []) as EventCategory[]

    // Replace the category in the existing results
    const existingCategory = updatedCategories.find(c => c.alias === categoryAlias)
    if (!existingCategory) {
      response.status(404).send({ error: 'Category not found in event results' })
      return
    }

    const catIdx = updatedCategories.findIndex(c => c.alias === categoryAlias)

    // Remove category
    updatedCategories.splice(catIdx, 1)

    const updatedResult: CreateEventResults = {
      hash: eventHash,
      ...existingEventResult,
      categories: updatedCategories,
    }

    await data.update.eventResults(updatedResult, {
      year: +year, updateSource: 'manual', userId: request.user!.sub,
    })

    await publishRaceEventChange({ year: +year, eventHashes: [eventHash] })

    response.status(204).send()
  })

  fastify.withTypeProvider<ZodTypeProvider>().post('/events', {
    preHandler: [fastify.requireRaceDirector],
    schema: {
      body: CreateEventSchema,
      response: {
        201: RaceEventSchema,
        400: z.object({ error: z.string() }),
        403: z.object({ error: z.string() }),
        404: z.object({ error: z.string() }),
        409: z.object({ error: z.string() }),
        500: z.object({ error: z.string() }),
      },
    },
  }, async (request, response) => {
    const eventData = request.body
    const eventYear = +eventData.date.slice(0, 4)

    const organizerAlias = request.user?.['custom:organizer_alias']
    if (!organizerAlias && !isSuperAdmin(request)) {
      response.status(403).send({ error: 'Access denied. Organizer alias required for non-superadmin users.' })
    }

    if (!isSuperAdmin(request) && eventData.organizerAlias !== organizerAlias) {
      response.status(400).send({ error: 'Invalid organizer alias' })
    }

    const filters: { year: number, organizerAlias: string } = {
      year: eventYear,
      organizerAlias: eventData.organizerAlias
    }

    const existingEvents = await data.get.events(filters, { summary: false }) as RaceEvent[]

    // Check if there is an existing event with the same name and date (potential duplicate)
    const conflictingEvent = existingEvents.find(e => e.name === eventData.name && e.date === eventData.date)
    if (conflictingEvent) {
      response.status(400).send({ error: 'Another event already exists with the same name and date' })
      return
    }

    const newEvent = {
      ...eventData,
      hash: nanoid(), // Generate a unique hash for the event
    } as CreateEvent

    // Update the event
    const { events: [createdEvent], skippedEvents } = await data.update.events([newEvent], {
      year: eventYear,
      updateSource: 'manual',
      userId: request.user!.sub,
    })

    if (skippedEvents?.length && skippedEvents.includes(createdEvent.hash)) {
      response.status(500).send({ error: 'Unknown error during event creation' })
      return
    }

    await publishRaceEventChange({ year: eventYear, eventHashes: [createdEvent.hash] })

    response.status(201).send(createdEvent)
  })

  fastify.withTypeProvider<ZodTypeProvider>().patch('/events/:year/:eventHash/:action', {
    preHandler: [fastify.requireRaceDirector],
    schema: {
      params: z.object({
        year: z.string(),
        eventHash: z.string(),
        action: z.enum(['lock', 'unlock', 'publish', 'unpublish']),
      }),
      response: {
        204: z.undefined(),
        403: z.object({ error: z.string() }),
        404: z.object({ error: z.string() }),
      },
    },
  }, async (request, response) => {
    const { year, eventHash, action } = request.params

    const organizerAlias = request.user?.['custom:organizer_alias']
    if (!organizerAlias && !isSuperAdmin(request)) {
      response.status(403).send({ error: 'Access denied. Organizer alias required for non-superadmin users.' })
      return
    }

    const filters: { year: number, eventHash: string, organizerAlias?: string } = { year: +year, eventHash }
    if (!isSuperAdmin(request) && organizerAlias) filters.organizerAlias = organizerAlias

    const [existingEvent] = await data.get.events(filters, { summary: false })

    if (!existingEvent) {
      response.status(404).send({ error: 'Event not found' })
      return
    }

    let updates: Partial<RaceEvent>
    if (action === 'lock' || action === 'unlock') {
      updates = { userLocked: action === 'lock' }
    } else {
      updates = { published: action === 'publish' }
    }

    await data.update.events([{ ...(existingEvent as RaceEvent), ...updates }], {
      year: +year, updateSource: 'manual', userId: request.user!.sub,
    })

    if (action === 'publish' || action === 'unpublish') {
      await publishRaceEventChange({ year: +year, eventHashes: [eventHash] })
    }

    response.status(204).send()
  })

  fastify.withTypeProvider<ZodTypeProvider>().put('/events/:year/:eventHash', {
    preHandler: [fastify.requireRaceDirector],
    schema: {
      params: z.object({
        year: z.string(),
        eventHash: z.string()
      }),
      body: UpdateEventSchema,
      response: {
        200: RaceEventSchema,
        403: z.object({ error: z.string() }),
        404: z.object({ error: z.string() }),
        409: z.object({ error: z.string() }),
      },
    },
  }, async (request, response) => {
    const { year, eventHash } = request.params
    const eventData = request.body

    const organizerAlias = request.user?.['custom:organizer_alias']
    if (!organizerAlias && !isSuperAdmin(request)) {
      response.status(403).send({ error: 'Access denied. Organizer alias required for non-superadmin users.' })
    }

    const filters: { year: number, eventHash: string, organizerAlias?: string } = { year: +year, eventHash }

    if (!isSuperAdmin(request) && organizerAlias) filters.organizerAlias = organizerAlias

    const [existingEvent] = await data.get.events(filters, { summary: false }) as RaceEvent[]

    if (!existingEvent) {
      response.status(404).send({ error: 'Event not found' })
      return
    }

    const shapedEvent = {
      ...omit(existingEvent, 'updatedAt', 'updatedBy', 'userLocked'),
      ...eventData,
      hash: eventHash,
    } as UpdateEvent

    // Update the event
    const { events: [updatedEvent], skippedEvents } = await data.update.events([shapedEvent], {
      year: +year,
      updateSource: 'manual',
      userId: request.user!.sub,
    })

    if (skippedEvents?.length && skippedEvents.includes(eventHash)) {
      response.status(409).send({ error: 'Event update skipped due to user lock. Please contact support if you need to update this event.' })
      return
    }

    await publishRaceEventChange({ year: +year, eventHashes: [eventHash] })

    response.status(200).send(updatedEvent)
  })

  fastify.withTypeProvider<ZodTypeProvider>().delete('/events/:year/:eventHash', {
    preHandler: [fastify.requireSuperAdmin],
    schema: {
      params: z.object({
        year: z.string(),
        eventHash: z.string(),
      }),
      response: {
        204: z.undefined(),
        400: z.object({ error: z.string() }),
        403: z.object({ error: z.string() }),
        404: z.object({ error: z.string() }),
      },
    },
  }, async (request, response) => {
    const { year, eventHash } = request.params

    const [event] = await data.get.events({ year: +year, eventHash }, { summary: false }) as RaceEvent[]

    if (!event) {
      response.status(404).send({ error: 'Event not found' })
      return
    }

    if (event.published) {
      response.status(400).send({ error: 'Published events cannot be deleted. Unpublish the event first.' })
      return
    }

    await data.delete.event(eventHash, +year)
    await publishRaceEventChange({ year: +year, eventHashes: [eventHash] })
    response.status(204).send()
  })
}