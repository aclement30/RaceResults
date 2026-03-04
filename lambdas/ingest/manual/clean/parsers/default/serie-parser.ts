import { parse } from 'csv-parse/sync'
import { sortBy } from 'lodash-es'
import defaultLogger from '../../../../../shared/logger.ts'
import type {
  AthleteSerieResult,
  SerieIndividualCategory, SerieResults,
  SerieSummary
} from '../../../../../../src/types/results.ts'
import {
  formatCategoryAlias, getBaseCategories, transformCategory
} from '../../../../../shared/utils.ts'
import { PROVIDER_NAME } from '../../../config.ts'
import type { ManualImportCategory, ManualImportRawData, ManualImportSerieFile } from '../../../types.ts'
import { TeamParser } from '../../../../../shared/team-parser.ts'
import type { AthleteManualEdit } from '../../../../../shared/types.ts'

const logger = defaultLogger.child({ provider: PROVIDER_NAME })

export const parseRawSerie = (
  serieBundle: ManualImportSerieFile,
  payloads: ManualImportRawData['payloads'],
  athleteManualEdits: Record<string, AthleteManualEdit>
): { serie: SerieSummary, serieResults: SerieResults } => {
  logger.info(`Importing serie results for: ${serieBundle.name}`)

  const serie: SerieSummary = {
    hash: serieBundle.hash,
    year: serieBundle.year,
    type: 'serie',
    organizerAlias: serieBundle.organizer,
    alias: serieBundle.name.replace(' ', '-'),
    name: serieBundle.name,
    provider: PROVIDER_NAME,
    categories: {},
    lastUpdated: serieBundle.lastUpdated,
  }

  const individualResults: Record<string, SerieIndividualCategory> = {}

  serieBundle.categories.individual?.forEach(importCategory => {
    const matchingFile = payloads[importCategory.filename]

    if (!matchingFile) throw new Error(`No matching file found for: ${importCategory.filename} (${importCategory.outputLabel})`)

    const categoryIndividualResults = parseSerieIndividualResults(matchingFile, {
      fields: serieBundle.fields,
      importCategory,
      year: serieBundle.year,
      athleteManualEdits,
    })
    const categoryGender = importCategory.outputLabel.includes('Men') ? 'M' : importCategory.outputLabel.includes('Women') ? 'F' : 'X'
    const categoryLabel = transformCategory(importCategory.outputLabel)
    const alias = formatCategoryAlias(categoryLabel)

    individualResults[alias] = {
      alias,
      label: categoryLabel,
      gender: categoryGender,
      results: categoryIndividualResults,
      corrections: importCategory.corrections,
    }
  })

  serie.categories = {
    individual: individualResults ? getBaseCategories(individualResults, { organizerAlias: serie.organizerAlias }) : undefined,
    // team: teamResults ? getBaseCategories(teamResults.results, { organizerAlias: serie.organizerAlias }) : undefined,
  }

  return {
    serie,
    serieResults: {
      hash: serie.hash,
      individual: {
        results: individualResults,
        sourceUrls: serieBundle.sourceUrls || [],
      },
      // team: teamResults,
      lastUpdated: serieBundle.lastUpdated,
    }
  }
}

const parseSerieIndividualResults = (
  csvData: string,
  { fields, importCategory, year, athleteManualEdits }:
  {
    fields: Record<string, string>,
    importCategory: ManualImportCategory,
    year: number,
    athleteManualEdits: Record<string, AthleteManualEdit>
  }
): AthleteSerieResult[] => {
  logger.info(`Parsing serie individual results for ${importCategory.outputLabel}`)

  const inputRecords = parse(csvData, {
    columns: true,
    skip_empty_lines: true
  }) as Record<string, string>[]

  // Transform records to series results
  const serieResults: Partial<AthleteSerieResult>[] = inputRecords.map((record) => {
    const shapedRecord: Record<string, any> = Object.keys(record).reduce((acc, inputField) => {
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

    const formattedUCIId = shapedRecord.uciId?.replace(/\s/g, '').trim()
    let team = TeamParser.parseTeamName(shapedRecord.team)
    // If athlete has an override for the current year team, use that instead
    const teamOverride = athleteManualEdits[formattedUCIId]?.teams?.[year]?.name
    if (teamOverride) {
      team = TeamParser.getTeamByName(teamOverride)
    }

    return {
      athleteId: shapedRecord.bibNumber?.toString(),
      bibNumber: shapedRecord.bibNumber ? +shapedRecord.bibNumber : undefined,
      firstName: shapedRecord.firstName,
      lastName: shapedRecord.lastName,
      license: shapedRecord.license,
      uciId: formattedUCIId,
      team: team?.name,
      totalPoints: +shapedRecord.totalPoints,
      racePoints: shapedRecord.racePoints,
    }
  })

  // Sort results in reverse order by total points (most point = first)
  let sortedSerieResults = sortBy(serieResults, 'totalPoints').reverse()
  sortedSerieResults = sortedSerieResults.map((result, index) => ({
    ...result,
    position: index + 1,
  }))

  return sortedSerieResults as AthleteSerieResult[]
}