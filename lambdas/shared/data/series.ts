import { isEqual, omit } from 'lodash-es'
import { nanoid } from 'nanoid'
import { SerieResultsSchema, SerieSchema } from '../../../shared/schemas/series.ts'
import { PUBLIC_BUCKET_PATHS } from '../../../src/config/s3.ts'
import { SERIES_RESULTS_SNAPSHOTS_PATH } from '../config.ts'
import type {
  CreateSerieIndividualCategory,
  CreateSerieResults,
  CreateSerieTeamCategory,
  Serie,
  SerieIndividualCategory,
  SerieResults,
  SerieResultsSnapshot,
  SerieTeamCategory,
  UpdateSerie,
} from '../types.ts'
import { s3 as RRS3 } from '../utils.ts'

export const getSeries = async (filters: {
  year: number,
  serieHash?: string,
  serieHashes?: string[]
}, options: { summary?: boolean } = {}): Promise<Serie[]> => {
  if (!options?.summary && typeof options.summary === 'undefined') options.summary = true

  const series = await loadSeriesForYear(filters.year)

  const serieHashes = filters.serieHashes || (filters.serieHash ? [filters.serieHash] : [])

  let filteredSeries = serieHashes.length ? series.filter(file => serieHashes.includes(file.hash)) : series

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

export const getSerieResults = async (serieHash: string, year: number) => {
  const filename = PUBLIC_BUCKET_PATHS.seriesResults + `${year}/${serieHash}.json`

  const fileContent = await RRS3.fetchFile(filename, true)

  if (!fileContent) return undefined

  return JSON.parse(fileContent) as SerieResults
}

export const updateSerieResults = async (
  serieResults: CreateSerieResults,
  { year, updateSource, userId, skipSnapshot }: {
    year: number,
    updateSource: 'ingest' | 'manual',
    userId: string,
    skipSnapshot?: boolean
  }
): Promise<SerieResults> => {
  const serieHash = serieResults.hash
  const existingSerieResults = await getSerieResults(serieHash, year)

  const filename = PUBLIC_BUCKET_PATHS.seriesResults + `${year}/${serieHash}.json`
  const now = new Date().toISOString()

  // Processes one category group (individual or team) through change detection,
  // userLocked filtering, and ordering — mirroring the event results pattern.
  function processCategories<
    TCreate extends {
      alias: string;
      userLocked?: boolean;
      createdAt?: string;
      createdBy?: string | null;
      updatedAt?: string | null;
    },
    TStored extends TCreate & {
      userLocked?: boolean;
      createdAt: string;
      createdBy: string;
      updatedAt: string | null;
      updatedBy: string | null;
    },
  >(
    incoming: TCreate[] | undefined,
    existing: TStored[] | undefined,
  ): { withMetadata: TStored[], ordered: TStored[] } {
    const incomingCats = incoming ?? []
    const existingCats = existing ?? []

    // Step 1: Determine which categories have changed
    const changed = incomingCats.filter(c => {
      const ex = existingCats.find(e => e.alias === c.alias)
      if (!ex) return true
      const incomingData = omit(c, ['createdAt', 'updatedAt'])
      const existingData = omit(ex, ['createdAt', 'createdBy', 'updatedAt', 'updatedBy', 'userLocked'])
      return !isEqual(incomingData, existingData)
    })

    // Step 2: Skip userLocked categories if updateSource is not 'manual'
    const toWrite = changed.filter(c =>
      updateSource === 'manual' || !existingCats.find(e => e.alias === c.alias)?.userLocked
    )

    // Step 3: Merge with existing, preserving or setting userLocked
    const withMetadata: TStored[] = toWrite.map(category => {
      const existing = existingCats.find(e => e.alias === category.alias)
      return {
        ...(existing ?? {}),
        ...category,
        userLocked: category.userLocked !== undefined ? category.userLocked : (existing?.userLocked || updateSource === 'manual'),
        createdAt: category.createdAt || existing?.createdAt || now,
        createdBy: existing ? existing.createdBy : userId,
        updatedAt: existing ? (category.updatedAt || now) : null,
        updatedBy: existing ? userId : null,
      } as TStored
    })

    // Step 4: Order categories
    // Manual: payload order is authoritative
    // Ingest with existing: preserve existing order, update in-place, append new at end
    const resolve = (alias: string): TStored => {
      return (
        withMetadata.find(u => u.alias === alias) ??
        existingCats.find(e => e.alias === alias) ??
        incomingCats.find(c => c.alias === alias) as unknown as TStored
      )
    }

    let ordered: TStored[]
    if (updateSource === 'manual' || !existingSerieResults) {
      ordered = incomingCats.map(c => resolve(c.alias))
    } else {
      ordered = [
        ...existingCats.map(c => resolve(c.alias)),
        ...withMetadata.filter(c => !existingCats.some(e => e.alias === c.alias)),
      ]
    }

    return { withMetadata, ordered }
  }

  const individualCategories = processCategories<CreateSerieIndividualCategory, SerieIndividualCategory>(
    serieResults.individual?.categories,
    existingSerieResults?.individual?.categories,
  )

  const teamCategories = processCategories<CreateSerieTeamCategory, SerieTeamCategory>(
    serieResults.team?.categories,
    existingSerieResults?.team?.categories,
  )

  const updatedSerieResults: SerieResults = {
    hash: serieResults.hash,
    individual: serieResults.individual !== undefined
      ? { sourceUrls: serieResults.individual.sourceUrls, categories: individualCategories.ordered }
      : existingSerieResults?.individual,
    team: serieResults.team !== undefined
      ? { sourceUrls: serieResults.team.sourceUrls, categories: teamCategories.ordered }
      : existingSerieResults?.team,
  }

  try {
    SerieResultsSchema.parse(updatedSerieResults)
  } catch (error) {
    throw new Error(`Validation failed for serie results with hash ${serieHash}: ${error}`)
  }

  await RRS3.writeFile(filename, JSON.stringify(updatedSerieResults))

  // Step 5: Create snapshots of the previous state of changed categories on manual saves
  const hasChanges = individualCategories.withMetadata.length > 0 || teamCategories.withMetadata.length > 0
  if (!skipSnapshot && updateSource === 'manual' && hasChanges) {
    const previousIndividual = individualCategories.withMetadata
    .map(c => existingSerieResults?.individual?.categories.find(e => e.alias === c.alias))
    .filter(c => c !== undefined)

    const previousTeam = teamCategories.withMetadata
    .map(c => existingSerieResults?.team?.categories.find(e => e.alias === c.alias))
    .filter(c => c !== undefined)

    if (previousIndividual.length > 0 || previousTeam.length > 0) {
      await createSerieResultsSnapshots(serieHash, year, {
        individual: previousIndividual,
        team: previousTeam,
      }, userId, now)
    }
  }

  return updatedSerieResults
}

const createSerieResultsSnapshots = async (
  serieHash: string,
  year: number,
  categories: { individual?: SerieIndividualCategory[], team?: SerieTeamCategory[] },
  userId: string,
  now: string,
): Promise<void> => {
  const filename = `${SERIES_RESULTS_SNAPSHOTS_PATH}${year}/${serieHash}/${now}.json`

  const excludedFields = ['createdAt', 'createdBy', 'updatedAt', 'updatedBy', 'userLocked']

  const snapshot: SerieResultsSnapshot = {
    hash: serieHash,
    // @ts-ignore
    individualCategories: (categories.individual ?? []).map(cat => omit(cat, excludedFields)),
    // @ts-ignore
    teamCategories: (categories.team ?? []).map(cat => omit(cat, excludedFields)),
    createdAt: now,
    createdBy: userId,
  }

  await RRS3.writeFile(filename, JSON.stringify(snapshot))
}

export const deleteSerie = async (hash: string, year: number): Promise<void> => {
  const publishedFilename = `${PUBLIC_BUCKET_PATHS.series}${year}.json`
  // const draftFilename = `${DRAFT_SERIES_PATH}${year}.json`
  const resultsFilename = `${PUBLIC_BUCKET_PATHS.seriesResults}${year}/${hash}.json`

  const [publishedContent] = await Promise.all([
    RRS3.fetchFile(publishedFilename, true),
    // RRS3.fetchFile(draftFilename, true),
  ])

  const publishedSeries = publishedContent ? (JSON.parse(publishedContent) as Serie[]).filter(s => s.hash !== hash) : []
  // const draftSeries = draftContent ? (JSON.parse(draftContent) as Serie[]).filter(s => s.hash !== hash) : []

  await Promise.all([
    RRS3.writeFile(publishedFilename, JSON.stringify(publishedSeries)),
    // RRS3.writeFile(draftFilename, JSON.stringify(draftSeries)),
    RRS3.deleteFile(resultsFilename),
  ])
}

export const loadSeriesForYear = async (
  year: number,
): Promise<Serie[]> => {
  const seriesFilename = `${PUBLIC_BUCKET_PATHS.series}${year}.json`

  const fileContent = await RRS3.fetchFile(seriesFilename, true)

  if (!fileContent) return []

  return JSON.parse(fileContent) as Serie[]
}
