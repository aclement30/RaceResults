import { isEqual, omit, pick, sortBy } from 'lodash-es'
import { nanoid } from 'nanoid'
import { EventResultsSchema, RaceEventSchema } from '../../../shared/schemas/events.ts'
import { PUBLIC_BUCKET_PATHS } from '../../../src/config/s3.ts'
import { DRAFT_EVENTS_PATH, EVENTS_RESULTS_SNAPSHOTS_PATH } from '../config.ts'
import type {
  CreateEvent,
  CreateEventResults,
  EventCategory,
  EventResults,
  EventResultsSnapshot,
  EventSummary,
  RaceEvent,
  UpdateEvent
} from '../types.ts'
import { hasDoubleUpgradePoints, hasUpgradePoints } from '../upgrade-points.ts'
import { s3 as RRS3 } from '../utils.ts'

export const getEvents = async (filters: {
  year: number,
  eventHash?: string,
  eventHashes?: string[]
  location?: { country: string, province: string }
  organizerAlias?: string
  serieAlias?: string
}, options: { summary?: boolean, includeDrafts?: boolean } = {}): Promise<RaceEvent[] | EventSummary[]> => {
  if (!options?.summary && typeof options.summary === 'undefined') options.summary = true

  const yearStoredEventFiles = await loadEventsForYear(filters.year, {
    summary: options.summary,
    includeDrafts: options.includeDrafts ?? true
  })

  const eventHashes = filters.eventHashes || (filters.eventHash ? [filters.eventHash] : [])

  let filteredEventFiles = eventHashes.length ? yearStoredEventFiles.filter(file => eventHashes.includes(file.hash)) : yearStoredEventFiles

  if (filters.location) {
    filteredEventFiles = filteredEventFiles.filter(event => event.location.country === filters.location!.country && event.location.province === filters.location!.province)
  }

  if (filters.organizerAlias) {
    filteredEventFiles = filteredEventFiles.filter(event => event.organizerAlias === filters.organizerAlias)
  }

  if (filters.serieAlias) {
    filteredEventFiles = filteredEventFiles.filter(event => event.serie === filters.serieAlias)
  }

  return filteredEventFiles
}

export const updateEvents = async (
  events: Array<CreateEvent | UpdateEvent>,
  { year, updateSource, userId }: { year: number, updateSource: 'ingest' | 'manual', userId: string }
): Promise<{ events: RaceEvent[], skippedEvents?: string[] }> => {
  const existingEventsForYear = await loadEventsForYear(year, { includeDrafts: true }) as RaceEvent[]
  const now = new Date().toISOString()

  // Step 1: Assign hashes to new events
  const eventsWithHashes = events.map(event => ({
    ...event,
    hash: (event as UpdateEvent).hash || nanoid(),
  }))

  // Step 2: Skip userLocked events if updateSource is not 'manual'
  const eventsToWrite = eventsWithHashes.filter(e =>
    updateSource === 'manual' || !existingEventsForYear.some(existing => existing.hash === e.hash && existing.userLocked)
  )

  // Step 3: Add metadata, userLocked flag, and computed fields
  const eventsWithMetadata: RaceEvent[] = eventsToWrite.map(e => {
    const existing = existingEventsForYear.find(existing => existing.hash === e.hash)
    return {
      ...(existing ?? {}),
      ...e,
      hasUpgradePoints: hasUpgradePoints(e.sanctionedEventType),
      isDoubleUpgradePoints: hasDoubleUpgradePoints(e.sanctionedEventType),
      source: existing?.source ?? updateSource,
      userLocked: (e as RaceEvent).userLocked !== undefined ? (e as RaceEvent).userLocked : (!!existing?.userLocked || updateSource === 'manual'),
      createdAt: existing?.createdAt ?? now,
      createdBy: existing?.createdBy ?? userId,
      updatedAt: existing ? (e.updatedAt ?? now) : null,
      updatedBy: existing ? userId : null,
    }
  })

  for (const event of eventsWithMetadata) {
    try {
      RaceEventSchema.parse(event)
    } catch (error) {
      throw new Error(`Validation failed for event with hash ${event.hash}: ${error}`)
    }
  }

  const writtenHashes = eventsWithMetadata.map(e => e.hash)
  const skippedEvents = eventsWithHashes
  .filter(e => !writtenHashes.includes(e.hash))
  .map(e => e.hash)

  const allEvents: RaceEvent[] = [
    ...existingEventsForYear.filter(e => !writtenHashes.includes(e.hash)),
    ...eventsWithMetadata,
  ]

  const publishedEvents = allEvents.filter(e => e.published)
  const draftEvents = allEvents.filter(e => !e.published)

  const publishedFilename = `${PUBLIC_BUCKET_PATHS.events}${year}.json`
  const draftFilename = `${DRAFT_EVENTS_PATH}${year}.json`

  await Promise.all([
    RRS3.writeFile(publishedFilename, JSON.stringify(publishedEvents)),
    RRS3.writeFile(draftFilename, JSON.stringify(draftEvents)),
  ])

  if (skippedEvents.length > 0) return { events: eventsWithMetadata, skippedEvents }

  return { events: eventsWithMetadata }
}

export const getEventResults = async (eventHash: string, year: number) => {
  const filename = PUBLIC_BUCKET_PATHS.eventsResults + `${year}/${eventHash}.json`

  const fileContent = await RRS3.fetchFile(filename, true)

  if (!fileContent) return undefined

  return JSON.parse(fileContent) as EventResults
}

export const updateEventResults = async (
  eventResults: CreateEventResults,
  { year, updateSource, userId, skipSnapshot }: {
    year: number,
    updateSource: 'ingest' | 'manual',
    userId: string,
    skipSnapshot?: boolean
  }
): Promise<EventResults> => {
  const eventHash = eventResults.hash
  const existingEventResults = await getEventResults(eventHash, year)

  const filename = PUBLIC_BUCKET_PATHS.eventsResults + `${year}/${eventHash}.json`
  const now = new Date().toISOString()

  // Step 1: Determine which categories have changed compared to existing
  const changedCategories = eventResults.categories.filter(c => {
    const existing = existingEventResults?.categories.find(e => e.alias === c.alias)
    if (!existing) return true

    // Compare data fields only, excluding metadata
    const incomingData = omit(c, ['createdAt', 'updatedAt'])
    const existingData = omit(existing, ['createdAt', 'createdBy', 'updatedAt', 'updatedBy', 'userLocked'])

    return !isEqual(incomingData, existingData)
  })

  // Step 2: Skip userLocked categories if updateSource is not 'manual'
  const categoriesToWrite = changedCategories.filter(c =>
    updateSource === 'manual' || !existingEventResults?.categories.find(e => e.alias === c.alias)?.userLocked
  )

  // Step 3: Add metadata and userLocked flag
  const categoriesWithMetadata: EventCategory[] = categoriesToWrite.map(c => {
    const existing = existingEventResults?.categories.find(e => e.alias === c.alias)
    return {
      ...(existing ?? {}),
      ...c,
      userLocked: c.userLocked !== undefined ? c.userLocked : (existing?.userLocked || updateSource === 'manual'),
      createdAt: c.createdAt || existing?.createdAt || now,
      createdBy: existing ? existing.createdBy : userId,
      updatedAt: existing ? (c.updatedAt || now) : null,
      updatedBy: existing ? userId : null,
    }
  })

  // Step 4: Build ordered categories.
  // Manual: payload order is authoritative; categories absent from payload will be deleted.
  // Ingest:
  //   - New event results: payload order is used as-is
  //   - Existing event results: existing order is preserved, updated in-place; new categories appended at the end.
  const resolveCategory = (alias: string): EventCategory => {
    const updated = categoriesWithMetadata.find(u => u.alias === alias)
    const existing = existingEventResults?.categories.find(e => e.alias === alias)
    return updated ?? existing ?? eventResults.categories.find(c => c.alias === alias) as unknown as EventCategory
  }

  let orderedCategories: EventCategory[]

  if (updateSource === 'manual' || !existingEventResults) {
    // Manual or first ingest: follow payload order, drop anything not in payload
    orderedCategories = eventResults.categories.map(c => resolveCategory(c.alias))
  } else {
    // Ingest with existing results: preserve existing order, update in-place
    orderedCategories = [
      ...existingEventResults.categories.map(c => resolveCategory(c.alias)),
      // Append new categories from payload not previously in existing
      ...categoriesWithMetadata.filter(c => !existingEventResults.categories.some(e => e.alias === c.alias)),
    ]
  }

  const updatedEventResults: EventResults = {
    ...(existingEventResults ?? {}),
    ...eventResults,
    categories: orderedCategories,
  }

  try {
    EventResultsSchema.parse(updatedEventResults)
  } catch (error) {
    throw new Error(`Validation failed for event results with hash ${eventHash}: ${error}`)
  }

  await RRS3.writeFile(filename, JSON.stringify(updatedEventResults))

  // Step 5: Create snapshots of the previous state of changed categories on manual saves
  if (!skipSnapshot && updateSource === 'manual' && categoriesWithMetadata.length > 0) {
    const previousCategories = categoriesWithMetadata
    .map(c => existingEventResults?.categories.find(e => e.alias === c.alias))
    .filter(c => c !== undefined)

    if (previousCategories.length > 0) {
      await createEventResultsSnapshots(eventHash, year, previousCategories, userId, now)
    }
  }

  return updatedEventResults
}

const createEventResultsSnapshots = async (
  eventHash: string,
  year: number,
  categories: EventCategory[],
  userId: string,
  now: string,
): Promise<void> => {
  const filename = `${EVENTS_RESULTS_SNAPSHOTS_PATH}${year}/${eventHash}/${now}.json`

  // Exclude metadata fields from the snapshot
  const categorySnapshots = categories.map(cat => omit(cat, [
    'createdAt',
    'createdBy',
    'updatedAt',
    'updatedBy',
    'userLocked'
  ]))

  const snapshot: EventResultsSnapshot = {
    hash: eventHash,
    categories: categorySnapshots,
    createdAt: now,
    createdBy: userId,
  }

  await RRS3.writeFile(filename, JSON.stringify(snapshot))
}

export const deleteEvent = async (hash: string, year: number): Promise<void> => {
  const publishedFilename = `${PUBLIC_BUCKET_PATHS.events}${year}.json`
  const draftFilename = `${DRAFT_EVENTS_PATH}${year}.json`
  const resultsFilename = `${PUBLIC_BUCKET_PATHS.eventsResults}${year}/${hash}.json`

  const [publishedContent, draftContent] = await Promise.all([
    RRS3.fetchFile(publishedFilename, true),
    RRS3.fetchFile(draftFilename, true),
  ])

  const publishedEvents = publishedContent ? (JSON.parse(publishedContent) as RaceEvent[]).filter(e => e.hash !== hash) : []
  const draftEvents = draftContent ? (JSON.parse(draftContent) as RaceEvent[]).filter(e => e.hash !== hash) : []

  await Promise.all([
    RRS3.writeFile(publishedFilename, JSON.stringify(publishedEvents)),
    RRS3.writeFile(draftFilename, JSON.stringify(draftEvents)),
    RRS3.deleteFile(resultsFilename),
  ])
}

export const loadEventsForYear = async (
  year: number,
  options: { summary?: boolean, includeDrafts?: boolean } = {}
): Promise<RaceEvent[] | EventSummary[]> => {
  const { summary = false, includeDrafts = true } = options

  const publishedFilename = `${PUBLIC_BUCKET_PATHS.events}${year}.json`
  const draftFilename = `${DRAFT_EVENTS_PATH}${year}.json`

  const [publishedContent, draftContent] = await Promise.all([
    RRS3.fetchFile(publishedFilename, true),
    includeDrafts ? RRS3.fetchFile(draftFilename, true) : Promise.resolve(null),
  ])

  const publishedEvents = publishedContent ? JSON.parse(publishedContent) as RaceEvent[] : []
  const draftEvents = draftContent ? JSON.parse(draftContent) as RaceEvent[] : []
  const allEvents = [...publishedEvents, ...draftEvents]

  const sortedEvents = sortBy(allEvents, 'date')

  if (!summary) return sortedEvents as RaceEvent[]

  return sortedEvents.map(event => pick(event, [
    'hash',
    'year',
    'date',
    'provider',
    'serie',
    'name',
    'location',
    'sanctionedEventType',
    'discipline',
    'organizerAlias'
  ])) as EventSummary[]
}
