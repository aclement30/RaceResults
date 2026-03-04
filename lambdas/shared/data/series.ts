import { PUBLIC_BUCKET_PATHS } from '../../../src/config/s3.ts'
import type { SerieResults, SerieSummary } from '../types.ts'
import { s3 as RRS3 } from '../utils.ts'

export const updateSeries = async (series: SerieSummary[], { year }: { year: number }) => {
  const seriesForYear = await loadSeriesForYear(year)

  const eventFilename = `${PUBLIC_BUCKET_PATHS.series}${year}.json`

  const updatedSeriesHashes = series.map(e => e.hash)
  const updatedSeries = [...seriesForYear.filter(e => !updatedSeriesHashes.includes(e.hash)), ...series]

  await RRS3.writeFile(eventFilename, JSON.stringify(updatedSeries))
}

export const updateSerieResults = async (
  serieResults: SerieResults,
  { year, eventHash }: { year: number, eventHash: string }
): Promise<void> => {
  const filename = PUBLIC_BUCKET_PATHS.seriesResults + `${year}/${eventHash}.json`

  await RRS3.writeFile(filename, JSON.stringify(serieResults))
}

export const loadSeriesForYear = async (
  year: number,
): Promise<SerieSummary[]> => {
  const seriesFilename = `${PUBLIC_BUCKET_PATHS.series}${year}.json`

  const fileContent = await RRS3.fetchFile(seriesFilename, true)

  if (!fileContent) return []

  return JSON.parse(fileContent) as SerieSummary[]
}
