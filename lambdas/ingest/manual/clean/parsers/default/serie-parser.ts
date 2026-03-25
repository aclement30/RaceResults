import { parse } from 'csv-parse/sync'
import { sortBy } from 'lodash-es'
import { formatCategoryAlias, transformCategoryLabel } from 'shared/categories'
import defaultLogger from 'shared/logger.ts'
import { TeamParser } from 'shared/team-parser'
import type {
  CreateSerieIndividualCategory,
  CreateSerieResults,
  ParticipantSerieResult,
  UpdateSerie,
} from 'shared/types.ts'
import { PROVIDER_NAME } from '../../../config.ts'
import type { ManualImportCategory, ManualImportRawData, ManualImportSerieFile } from '../../../types.ts'

const logger = defaultLogger.child({ provider: PROVIDER_NAME })

export const parseRawSerie = async (
  serieBundle: ManualImportSerieFile,
  payloads: ManualImportRawData['payloads'],
): Promise<{ serie: UpdateSerie, serieResults: CreateSerieResults }> => {
  logger.info(`Importing serie results for: ${serieBundle.name}`)

  const serie: UpdateSerie = {
    hash: serieBundle.hash,
    year: serieBundle.year,
    organizerAlias: serieBundle.organizer,
    alias: serieBundle.name.replace(' ', '-'),
    name: serieBundle.name,
    types: ['individual'], // Only individual series are supported
    // Metadata
    provider: PROVIDER_NAME,
    updatedAt: serieBundle.lastUpdated,
    published: true,
  }

  const individualResultCategories: CreateSerieIndividualCategory[] = []

  for (const importCategory of serieBundle.categories.individual ?? []) {
    const matchingFile = payloads[importCategory.filename]

    if (!matchingFile) throw new Error(`No matching file found for: ${importCategory.filename} (${importCategory.outputLabel})`)

    const categoryIndividualResults = parseSerieIndividualResults(matchingFile, {
      fields: serieBundle.fields,
      importCategory,
      year: serieBundle.year,
    })
    const categoryGender = importCategory.outputLabel.includes('Men') ? 'M' : importCategory.outputLabel.includes('Women') ? 'F' : 'X'
    const categoryLabel = await transformCategoryLabel(importCategory.outputLabel)
    const alias = formatCategoryAlias(categoryLabel)

    individualResultCategories.push({
      alias,
      label: categoryLabel,
      gender: categoryGender,
      results: categoryIndividualResults,
      corrections: importCategory.corrections,
      updatedAt: serieBundle.lastUpdated,
    })
  }

  return {
    serie,
    serieResults: {
      hash: serie.hash,
      individual: {
        categories: individualResultCategories,
        sourceUrls: serieBundle.sourceUrls || [],
      },
      // team: teamResults,
    }
  }
}

const parseSerieIndividualResults = (
  csvData: string,
  { fields, importCategory, year }:
  {
    fields: Record<string, string>,
    importCategory: ManualImportCategory,
    year: number,
  }
): ParticipantSerieResult[] => {
  logger.info(`Parsing serie individual results for ${importCategory.outputLabel}`)

  const inputRecords = parse(csvData, {
    columns: true,
    skip_empty_lines: true
  }) as Record<string, string>[]

  // Transform records to series results
  const serieResults: Omit<ParticipantSerieResult, 'position'>[] = inputRecords.map((record) => {
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
    const teamOverride = TeamParser.getManualTeamForAthlete(formattedUCIId, year)
    if (teamOverride) {
      team = teamOverride
    }

    return {
      participantId: shapedRecord.bibNumber?.toString(),
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
  const sortedSerieResults = sortBy(serieResults, 'totalPoints')
  .reverse()
  .map((result, index) => ({
    ...result,
    position: index + 1,
  }))

  return sortedSerieResults
}