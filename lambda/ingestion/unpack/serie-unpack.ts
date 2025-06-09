import type { CleanSerieWithResults } from '../shared/types.ts'
import type { SerieResults, SerieSummary } from '../../../src/types/results.ts'
import { getBaseCategories } from '../shared/utils.ts'

export const unpackSerie = (serie: CleanSerieWithResults): { summary: SerieSummary, results: SerieResults } => {
  const summary: SerieSummary = {
    hash: serie.hash,
    alias: serie.alias,
    name: serie.name,
    year: serie.year,
    type: 'serie',
    organizerAlias: serie.organizerAlias,
    provider: serie.provider,
    categories: {
      individual: serie.individual?.results ? getBaseCategories(serie.individual?.results) : undefined,
      team: serie.team?.results ? getBaseCategories(serie.team?.results) : undefined,
    },
  }

  const results: SerieResults = {
    hash: serie.hash,
    individual: serie.individual,
    team: serie.team,
    lastUpdated: serie.lastUpdated,
  }

  return {
    summary,
    results,
  }
}