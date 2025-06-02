import { parse } from 'csv-parse/sync'
import type { ManualImportCategory, ManualImportSerieFile } from './types.ts'
import type {
  AthleteSerieResult,
  SerieIndividualCategory,
  SerieResults,
  SerieSummary
} from '../../../src/types/results.ts'
import defaultLogger from '../shared/logger.ts'
import { formatCategoryAlias, getBaseCategories, sortByCategory as defautSortByCategory } from '../shared/utils.ts'
import _ from 'lodash'
import { fetchFile } from './aws-s3.ts'

const logger = defaultLogger.child({ provider: 'manual-import' })

export async function importSeriesResults(manualImportSerie: Omit<ManualImportSerieFile, 'files'>, sourceFiles: string[]) {
  const fileContents: Record<string, string> = {}

  logger.info(`Importing series results for ${manualImportSerie.name}...`)

  for (const filename of sourceFiles) {
    const fileContent = await fetchFile(filename)

    if (!fileContent) throw new Error(`File ${filename} not found!`)

    const basename = filename!.split('/').pop()!
    fileContents[basename] = fileContent
  }

  const seriesSummary: SerieSummary = {
    hash: manualImportSerie.hash,
    year: manualImportSerie.year,
    organizerAlias: manualImportSerie.organizer,
    alias: manualImportSerie.name.replace(' ', '-'),
    name: manualImportSerie.name,
    provider: 'manual-import',
    categories: {},
  }

  const seriesResults: SerieResults = {
    hash: seriesSummary.hash,
    lastUpdated: manualImportSerie.lastUpdated,
  }

  const individualResults: Record<string, SerieIndividualCategory> = {}
  const combinedIndividualSourceUrls: string[] = []

  manualImportSerie.categories.individual?.forEach(importCategory => {
    const matchingFile = fileContents[importCategory.filename]

    if (!matchingFile) throw new Error(`No matching file found for: ${importCategory.filename} (${importCategory.outputLabel})`)

    const categoryIndividualResults = parseSerieIndividualResults(matchingFile, manualImportSerie.fields, importCategory)
    const categoryGender = importCategory.outputLabel.includes('Men') ? 'M' : importCategory.outputLabel.includes('Women') ? 'F' : 'X'
    const categoryLabel = transformCategory(importCategory.outputLabel)
    const alias = formatCategoryAlias(categoryLabel)

    individualResults[alias] = {
      alias,
      label: categoryLabel,
      gender: categoryGender,
      results: categoryIndividualResults,
    }

    combinedIndividualSourceUrls.push(importCategory.filename)
  })

  seriesResults.individual = {
    results: individualResults,
    sourceUrls: combinedIndividualSourceUrls,
  }

  seriesSummary.categories.individual = getBaseCategories(individualResults).sort(sortByCategory(manualImportSerie.organizer))

  return {
    summary: seriesSummary,
    results: seriesResults,
    type: 'series',
  }
}

function parseSerieIndividualResults(csvData: string, fields: Record<string, string>, importCategory: ManualImportCategory): AthleteSerieResult[] {
  logger.info(`Parsing serie individual results for ${importCategory.outputLabel}...`)

  const inputRecords = parse(csvData, {
    columns: true,
    skip_empty_lines: true
  })

  // Transform records to series results
  const serieResults: Partial<AthleteSerieResult>[] = inputRecords.map((record: Record<string, string>) => {
    const shapedRecord: Record<string, string> = Object.keys(record).reduce((acc, inputField) => {
      const outputField = fields[inputField]
      const value = record[inputField]

      if (outputField) {
        acc[outputField] = value
      } else if (inputField.match(/^\d{4}\-(0[1-9]|1[012])\-(0[1-9]|[12][0-9]|3[01])$/)) {
        if (!acc['racePoints']) acc['racePoints'] = {}
        acc['racePoints'][inputField] = +value
      }

      return acc
    }, {} as Record<string, any>)

    return {
      bibNumber: shapedRecord.bibNumber ? +shapedRecord.bibNumber : undefined,
      firstName: shapedRecord.firstName,
      lastName: shapedRecord.lastName,
      license: shapedRecord.license,
      uciId: shapedRecord.uciId,
      team: shapedRecord.team,
      totalPoints: +shapedRecord.totalPoints,
      racePoints: shapedRecord.racePoints,
    }
  })

  // Sort results in reverse order by total points (most point = first)
  let sortedSerieResults = _.sortBy(serieResults, 'totalPoints').reverse()
  sortedSerieResults = sortedSerieResults.map((result, index) => ( {
    ...result,
    position: index + 1,
  } ))

  return sortedSerieResults as AthleteSerieResult[]
}

const transformCategory = (catName: string): string => {
  return catName.replace('(Men)', '(M)').replace('(Women)', '(W)')
}

function sortByCategory(organizer: string) {
  if (organizer === 'CRC') {
    const crcCatOrder = ['expert (m)', 'expert (w)', 'advanced (m)', 'advanced (w)', 'sport (m)', 'sport (w)', 'novice (m)', 'novice (w)']

    return (a: { label: string }, b: { label: string }): number => {
      const indexA = crcCatOrder.indexOf(a.label.toLowerCase())
      const indexB = crcCatOrder.indexOf(b.label.toLowerCase())

      if (indexA === -1 && indexB === -1) return 0
      if (indexA === -1) return 1
      if (indexB === -1) return -1

      return indexA - indexB
    }
  }

  return defautSortByCategory
}