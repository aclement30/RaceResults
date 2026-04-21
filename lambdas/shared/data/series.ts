import { isEqual, omit } from 'lodash-es'
import { nanoid } from 'nanoid'
import { SerieSchema, SerieStandingsSchema } from '../../../shared/schemas/series.ts'
import { PUBLIC_BUCKET_PATHS } from '../../../src/config/s3.ts'
import { DRAFT_SERIES_STANDINGS_PATH, SERIES_STANDINGS_SNAPSHOTS_PATH } from '../config.ts'
import type {
  BaseCategory,
  Serie,
  SerieIndividualEvent,
  SerieResultsSnapshot,
  SerieStandings,
  SerieTeamEvent,
  UpdateSerie,
} from '../types.ts'
import { s3 as RRS3 } from '../utils.ts'

export const getSeries = async (filters: {
  year: number,
  serieHash?: string,
  serieHashes?: string[]
  organizerAlias?: string
}, options: { summary?: boolean } = {}): Promise<Serie[]> => {
  if (!options?.summary && typeof options.summary === 'undefined') options.summary = true

  const series = await loadSeriesForYear(filters.year)

  const serieHashes = filters.serieHashes || (filters.serieHash ? [filters.serieHash] : [])

  let filteredSeries = serieHashes.length ? series.filter(file => serieHashes.includes(file.hash)) : series

  if (filters.organizerAlias) {
    filteredSeries = filteredSeries.filter(serie => serie.organizerAlias === filters.organizerAlias)
  }

  return filteredSeries
}

export const updateSeries = async (
  series: UpdateSerie[],
  { year, updateSource, userId }: { year: number, updateSource: 'ingest' | 'manual', userId: string }
): Promise<{ series: Serie[], skippedSeries?: string[] }> => {
  const existingSeriesForYear = await loadSeriesForYear(year)
  const serieFilename = `${PUBLIC_BUCKET_PATHS.series}${year}.json`
  const now = new Date().toISOString()

  // Step 1: Assign hashes to new series
  const seriesWithHashes = series.map(serie => ({
    ...serie,
    hash: (serie as UpdateSerie).hash || nanoid(),
  }))

  // Step 2: Skip userLocked events if updateSource is not 'manual'
  const seriesToWrite = seriesWithHashes.filter(e =>
    updateSource === 'manual' || !existingSeriesForYear.some(existing => existing.hash === e.hash && existing.userLocked)
  )

  // Step 3: Add metadata, userLocked flag
  const seriesWithMetadata: Serie[] = seriesToWrite.map(e => {
    const existing = existingSeriesForYear.find(existing => existing.hash === e.hash)
    return {
      ...(existing ?? {}),
      ...e,
      source: existing?.source ?? updateSource,
      userLocked: !!existing?.userLocked || updateSource === 'manual',
      createdAt: existing?.createdAt ?? now,
      createdBy: existing?.createdBy ?? userId,
      updatedAt: existing ? (e.updatedAt ?? now) : null,
      updatedBy: existing ? userId : null,
    }
  })

  // Step 4: Validate series against schema before writing
  for (const serie of seriesWithMetadata) {
    try {
      SerieSchema.parse(serie)
    } catch (error) {
      throw new Error(`Validation failed for serie with hash ${serie.hash}: ${error}`)
    }
  }

  const writtenHashes = seriesWithMetadata.map(e => e.hash)
  const skippedSeries = seriesWithHashes
  .filter(e => !writtenHashes.includes(e.hash))
  .map(e => e.hash)

  const updatedSeries: Serie[] = [
    ...existingSeriesForYear.filter(s => !writtenHashes.includes(s.hash)),
    ...seriesWithMetadata,
  ]

  await RRS3.writeFile(serieFilename, JSON.stringify(updatedSeries))

  if (skippedSeries.length > 0) return { series: seriesWithMetadata, skippedSeries }

  return { series: seriesWithMetadata }
}

export const getSerieStandings = async (serieHash: string, year: number, { includeDrafts = true } = {}) => {
  const publishedFilename = PUBLIC_BUCKET_PATHS.seriesStandings + `${year}/${serieHash}.json`
  const draftFilename = DRAFT_SERIES_STANDINGS_PATH + `${year}/${serieHash}.json`

  const [publishedContent, draftContent] = await Promise.all([
    RRS3.fetchFile(publishedFilename, true),
    includeDrafts ? RRS3.fetchFile(draftFilename, true) : null,
  ])

  if (!publishedContent && !draftContent) return undefined

  const published = publishedContent ? JSON.parse(publishedContent) as SerieStandings : undefined
  const draft = draftContent ? JSON.parse(draftContent) as SerieStandings : undefined

  if (!draft) return published
  if (!published) return draft

  return {
    ...published,
    categories: [
      ...(published.categories ?? []),
      ...(draft.categories ?? []).filter(dc => !(published.categories ?? []).some(pc => pc.alias === dc.alias)),
    ],
    individual: published.individual || draft.individual ? {
      ...(published.individual ?? draft.individual!),
      events: [
        ...(published.individual?.events ?? []),
        ...(draft.individual?.events ?? []),
      ],
    } : undefined,
    team: published.team || draft.team ? {
      ...(published.team ?? draft.team!),
      events: [
        ...(published.team?.events ?? []),
        ...(draft.team?.events ?? []),
      ],
    } : undefined,
  } as SerieStandings
}

export const updateSerieStandings = async (
  serieStandings: SerieStandings,
  { year, updateSource, userId, skipSnapshot }: {
    year: number,
    updateSource: 'ingest' | 'manual',
    userId: string,
    skipSnapshot?: boolean
  }
): Promise<{ serieStandings: SerieStandings, standingsUpdatedAt: string | null, hasPublishedEvents: boolean }> => {
  const serieHash = serieStandings.hash
  const existingSerieResults = await getSerieStandings(serieHash, year)

  const publishedFilename = PUBLIC_BUCKET_PATHS.seriesStandings + `${year}/${serieHash}.json`
  const draftFilename = DRAFT_SERIES_STANDINGS_PATH + `${year}/${serieHash}.json`
  const now = new Date().toISOString()

  // ── Categories ────────────────────────────────────────────────
  // Categories are lightweight metadata (no events inside).
  // Events are a flat array keyed by (date, categoryAlias).

  const processCategories = () => {
    const incomingCategories = serieStandings.categories ?? []
    const existingCategories = existingSerieResults?.categories ?? []

    // Categories are lightweight label/alias metadata — no audit fields.
    const toSerieCategory = (category: BaseCategory): BaseCategory => ({
      alias: category.alias,
      label: category.label,
      gender: category.gender,
      ...(category.parentCategory ? { parentCategory: category.parentCategory } : {}),
    })

    const incomingSerieCategories = incomingCategories.map(toSerieCategory)

    let orderedCategories: BaseCategory[]
    if (updateSource === 'manual' || !existingSerieResults) {
      orderedCategories = incomingSerieCategories
    } else {
      const catMap = new Map(incomingSerieCategories.map(c => [c.alias, c]))
      orderedCategories = [
        ...existingCategories.map(c => catMap.get(c.alias) ?? toSerieCategory(c)),
        ...incomingSerieCategories.filter(c => !existingCategories.some(e => e.alias === c.alias)),
      ]
    }

    return orderedCategories
  }

  const processEvents = <T extends SerieIndividualEvent | SerieTeamEvent>(
    incomingEvents: T[],
    existingEvents: T[] = []
  ) => {
    const previousEvents: T[] = []

    // Build a mutable map of date → SerieIndividualEvent from existing events
    const eventsByDate = new Map<string | null, T>(
      existingEvents.map(e => [e.date, e])
    )

    // Track which dates were touched by the incoming payload
    const touchedDates = new Set<string | null>()

    for (const incomingEvent of incomingEvents) {
      const { date, categories: incomingCategories, published } = incomingEvent as T
      touchedDates.add(date)

      const existingSerieEvent = eventsByDate.get(date)
      let snapshotCaptured = false

      const updatedEventCategories: T['categories'] = {
        ...(existingSerieEvent?.categories ?? {}),
      }

      for (const [categoryAlias, standing] of Object.entries(incomingCategories)) {
        const existingCategoryStanding = existingSerieEvent?.categories[categoryAlias]

        // Skip userLocked categories for non-manual updates
        if (existingCategoryStanding?.userLocked && updateSource !== 'manual') continue

        // Check if the category standing actually changed
        const incomingStandingData = omit(standing, ['createdAt', 'updatedAt'])
        const existingStandingData = existingCategoryStanding
          ? omit(existingCategoryStanding, ['createdAt', 'createdBy', 'updatedAt', 'updatedBy', 'userLocked'])
          : null

        if (existingStandingData && isEqual(incomingStandingData, existingStandingData)) continue

        // Capture previous event state for snapshot once per event date
        if (!snapshotCaptured && existingSerieEvent) {
          previousEvents.push(existingSerieEvent)
          snapshotCaptured = true
        }

        updatedEventCategories[categoryAlias] = {
          ...(existingCategoryStanding ?? {}),
          ...standing,
          userLocked: standing.userLocked ?? (existingCategoryStanding?.userLocked || updateSource === 'manual'),
          createdAt: standing.createdAt || existingCategoryStanding?.createdAt || now,
          createdBy: existingCategoryStanding?.createdBy ?? userId,
          updatedAt: existingCategoryStanding ? (standing.updatedAt || now) : null,
          updatedBy: existingCategoryStanding ? userId : null,
        }
      }

      eventsByDate.set(date, {
        ...(existingSerieEvent ?? {}),
        ...incomingEvent,
        published: published ?? existingSerieEvent?.published ?? true,
        categories: updatedEventCategories,
      } as T)
    }

    // Order: manual or new → payload date order first, then remaining; ingest → preserve existing order
    let orderedEvents: T[]
    if (updateSource === 'manual' || !existingSerieResults) {
      const touchedInOrder = incomingEvents
      .map((e: T) => e.date)
      .filter((date, index, arr) => arr.indexOf(date) === index)
      .map((date: string | null) => eventsByDate.get(date))
      .filter((e): e is T => !!e)

      const untouched = existingEvents.filter(e => !touchedDates.has(e.date))
      orderedEvents = [...touchedInOrder, ...untouched]
    } else {
      // Preserve existing order; append newly introduced dates at the end
      orderedEvents = [
        ...existingEvents
        .map(e => eventsByDate.get(e.date))
        .filter((e): e is T => !!e),
        ...[...touchedDates]
        .filter(date => !existingEvents.some(e => e.date === date))
        .map(date => eventsByDate.get(date))
        .filter((e): e is T => !!e),
      ]
    }

    return { orderedEvents, previousEvents }
  }

  const processedCategories = processCategories()
  const individualStandings = serieStandings.individual !== undefined ? processEvents(serieStandings.individual?.events, existingSerieResults?.individual?.events) : null
  const teamStandings = serieStandings.team !== undefined ? processEvents(serieStandings.team?.events, existingSerieResults?.team?.events) : null

  const updatedSerieResults: SerieStandings = {
    hash: serieStandings.hash,
    categories: processedCategories,
    individual: individualStandings
      ? { sourceUrls: serieStandings.individual!.sourceUrls, events: individualStandings.orderedEvents }
      : existingSerieResults?.individual,
    team: teamStandings
      ? { sourceUrls: serieStandings.team!.sourceUrls, events: teamStandings.orderedEvents }
      : existingSerieResults?.team,
  }

  try {
    SerieStandingsSchema.parse(updatedSerieResults)
  } catch (error) {
    throw new Error(`Validation failed for serie results with hash ${serieHash}: ${error}`)
  }

  const publishedIndividualEvents = updatedSerieResults.individual?.events.filter(e => e.published) ?? []
  const publishedTeamEvents = updatedSerieResults.team?.events.filter(e => e.published) ?? []

  const draftIndividualEvents = updatedSerieResults.individual?.events.filter(e => !e.published) ?? []
  const draftTeamEvents = updatedSerieResults.team?.events.filter(e => !e.published) ?? []

  const publishedResult: SerieStandings = {
    ...updatedSerieResults,
    ...(updatedSerieResults.individual ? {
      individual: { ...updatedSerieResults.individual, events: publishedIndividualEvents },
    } : {}),
    ...(updatedSerieResults.team ? {
      team: { ...updatedSerieResults.team, events: publishedTeamEvents },
    } : {}),
  }

  const draftResult: SerieStandings = {
    ...updatedSerieResults,
    ...(updatedSerieResults.individual ? {
      individual: { ...updatedSerieResults.individual, events: draftIndividualEvents },
    } : {}),
    ...(updatedSerieResults.team ? {
      team: { ...updatedSerieResults.team, events: draftTeamEvents },
    } : {}),
  }

  // Compute serie-level standings summary
  const allEvents = [
    ...(updatedSerieResults.individual?.events ?? []),
    ...(updatedSerieResults.team?.events ?? []),
  ]
  const allCategoryUpdatedAts = allEvents.flatMap(event =>
    Object.values(event.categories).map(cat => cat.updatedAt).filter((date): date is string => !!date)
  )
  const standingsUpdatedAt = allCategoryUpdatedAts.length > 0
    ? new Date(Math.max(...allCategoryUpdatedAts.map(date => new Date(date).getTime()))).toISOString()
    : null
  const hasPublishedEvents = allEvents.some(e => e.published)

  await Promise.all([
    RRS3.writeFile(publishedFilename, JSON.stringify(publishedResult)),
    RRS3.writeFile(draftFilename, JSON.stringify(draftResult)),
    updateSerieStandingsSummary(serieHash, year, { standingsUpdatedAt, hasPublishedEvents }),
  ])

  // Snapshots: capture previous state of changed events/categories on manual saves
  if (!skipSnapshot && updateSource === 'manual') {
    const previousIndividualEvents = individualStandings?.previousEvents ?? []
    const previousTeamEvents = teamStandings?.previousEvents ?? []

    if (previousIndividualEvents.length > 0 || previousTeamEvents.length > 0) {
      await createSerieResultsSnapshots(serieHash, year, {
        previousIndividualEvents,
        previousTeamEvents,
      }, userId, now)
    }
  }

  return { serieStandings: updatedSerieResults, standingsUpdatedAt, hasPublishedEvents }
}

const createSerieResultsSnapshots = async (
  serieHash: string,
  year: number,
  previous: { previousIndividualEvents: SerieIndividualEvent[], previousTeamEvents: SerieTeamEvent[] },
  userId: string,
  now: string,
): Promise<void> => {
  const filename = `${SERIES_STANDINGS_SNAPSHOTS_PATH}${year}/${serieHash}/${now}.json`

  const snapshot: SerieResultsSnapshot = {
    hash: serieHash,
    previousIndividualEvents: previous.previousIndividualEvents,
    previousTeamEvents: previous.previousTeamEvents,
    createdAt: now,
    createdBy: userId,
  }

  await RRS3.writeFile(filename, JSON.stringify(snapshot))
}

export const deleteSerieStandingEvent = async (serieHash: string, year: number, date: string): Promise<void> => {
  const publishedFilename = PUBLIC_BUCKET_PATHS.seriesStandings + `${year}/${serieHash}.json`
  const draftFilename = DRAFT_SERIES_STANDINGS_PATH + `${year}/${serieHash}.json`

  const [publishedContent, draftContent] = await Promise.all([
    RRS3.fetchFile(publishedFilename, true),
    RRS3.fetchFile(draftFilename, true),
  ])

  const updates: Promise<void>[] = []

  if (publishedContent) {
    const published = JSON.parse(publishedContent) as SerieStandings
    const updated: SerieStandings = {
      ...published,
      ...(published.individual ? {
        individual: { ...published.individual, events: published.individual.events.filter(e => e.date !== date) },
      } : {}),
      ...(published.team ? {
        team: { ...published.team, events: published.team.events.filter(e => e.date !== date) },
      } : {}),
    }
    updates.push(RRS3.writeFile(publishedFilename, JSON.stringify(updated)))
  }

  if (draftContent) {
    const draft = JSON.parse(draftContent) as SerieStandings
    const updated: SerieStandings = {
      ...draft,
      ...(draft.individual ? {
        individual: { ...draft.individual, events: draft.individual.events.filter(e => e.date !== date) },
      } : {}),
      ...(draft.team ? {
        team: { ...draft.team, events: draft.team.events.filter(e => e.date !== date) },
      } : {}),
    }
    updates.push(RRS3.writeFile(draftFilename, JSON.stringify(updated)))
  }

  await Promise.all(updates)
}

export const deleteSerie = async (hash: string, year: number): Promise<void> => {
  const publishedFilename = `${PUBLIC_BUCKET_PATHS.series}${year}.json`
  const resultsFilename = `${PUBLIC_BUCKET_PATHS.seriesStandings}${year}/${hash}.json`
  const draftStandingsFilename = `${DRAFT_SERIES_STANDINGS_PATH}${year}/${hash}.json`

  const publishedContent = await RRS3.fetchFile(publishedFilename, true)
  const publishedSeries = publishedContent ? (JSON.parse(publishedContent) as Serie[]).filter(s => s.hash !== hash) : []

  await Promise.all([
    RRS3.writeFile(publishedFilename, JSON.stringify(publishedSeries)),
    RRS3.deleteFile(resultsFilename),
    RRS3.deleteFile(draftStandingsFilename),
  ])
}

const updateSerieStandingsSummary = async (
  serieHash: string,
  year: number,
  patch: { standingsUpdatedAt: string | null, hasPublishedEvents: boolean },
): Promise<void> => {
  const seriesFilename = `${PUBLIC_BUCKET_PATHS.series}${year}.json`
  const series = await loadSeriesForYear(year)
  const updated = series.map(s => s.hash === serieHash ? { ...s, ...patch } : s)
  await RRS3.writeFile(seriesFilename, JSON.stringify(updated))
}

export const loadSeriesForYear = async (
  year: number,
): Promise<Serie[]> => {
  const seriesFilename = `${PUBLIC_BUCKET_PATHS.series}${year}.json`

  const fileContent = await RRS3.fetchFile(seriesFilename, true)

  if (!fileContent) return []

  return JSON.parse(fileContent) as Serie[]
}
