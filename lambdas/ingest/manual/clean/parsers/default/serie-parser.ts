import { parse } from 'csv-parse/sync'
import { formatCategoryAlias, transformCategoryLabel } from 'shared/categories'
import defaultLogger from 'shared/logger.ts'
import { TeamParser } from 'shared/team-parser'
import type {
  BaseCategory,
  ParticipantSerieEventResult,
  SerieIndividualEvent,
  SerieStandings,
  UpdateSerie,
} from 'shared/types.ts'
import { PROVIDER_NAME } from '../../../config.ts'
import type { ManualImportCategory, ManualImportRawData, ManualImportSerieFile } from '../../../types.ts'

const logger = defaultLogger.child({ provider: PROVIDER_NAME })

export const parseRawSerie = async (
  serieBundle: ManualImportSerieFile,
  payloads: ManualImportRawData['payloads'],
): Promise<{ serie: UpdateSerie, serieStandings: SerieStandings }> => {
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
  }

  const individualCategories: BaseCategory[] = []
  const allEvents: SerieIndividualEvent[] = []

  for (const importCategory of serieBundle.categories.individual ?? []) {
    const matchingFile = payloads[importCategory.filename]

    if (!matchingFile) throw new Error(`No matching file found for: ${importCategory.filename} (${importCategory.outputLabel})`)

    const categoryGender = importCategory.outputLabel.includes('Men') ? 'M' : importCategory.outputLabel.includes('Women') ? 'F' : 'X'
    const categoryLabel = await transformCategoryLabel(importCategory.outputLabel)
    const categoryAlias = formatCategoryAlias(importCategory.outputLabel)

    individualCategories.push({
      alias: categoryAlias,
      label: categoryLabel,
      gender: categoryGender,
    })

    const categoryEvents = parseSerieIndividualResults(matchingFile, {
      fields: serieBundle.fields,
      importCategory,
      year: serieBundle.year,
      categoryAlias,
    })

    if (importCategory.corrections) {
      // Add corrections as a note to last event in the category
      const lastEvent = categoryEvents[categoryEvents.length - 1]
      if (lastEvent) {
        lastEvent.categories[categoryAlias].corrections = importCategory.corrections
      }
    }

    allEvents.push(...categoryEvents)
  }

  return {
    serie,
    serieStandings: {
      hash: serie.hash,
      categories: individualCategories,
      individual: {
        events: allEvents,
        sourceUrls: serieBundle.sourceUrls || [],
      },
    }
  }
}

const parseSerieIndividualResults = (
  csvData: string,
  { fields, importCategory, year, categoryAlias }:
  {
    fields: Record<string, string>,
    importCategory: ManualImportCategory,
    year: number,
    categoryAlias: string,
  }
): SerieIndividualEvent[] => {
  logger.info(`Parsing serie individual results for ${importCategory.outputLabel}`)

  const inputRecords = parse(csvData, {
    columns: true,
    skip_empty_lines: true
  }) as Record<string, string>[]

  // Collect per-athlete data with racePoints keyed by date
  type ParticipantStanding = Partial<Omit<ParticipantSerieEventResult, 'points'>> & {
    racePoints: Record<string, number>
  }

  const combinedStandings: ParticipantStanding[] = inputRecords.map((record) => {
    const racePoints: Record<string, number> = {}
    const shapedRecord: Record<string, any> = {}

    for (const inputField of Object.keys(record)) {
      const outputField = fields[inputField]
      const value = record[inputField]

      if (outputField) {
        shapedRecord[outputField] = value
      } else if (inputField.match(/^\d{4}-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])$/)) {
        racePoints[inputField] = +value
      }
    }

    const formattedUCIId = shapedRecord.uciId?.replace(/\s/g, '').trim()
    let team = TeamParser.parseTeamName(shapedRecord.team)
    const teamOverride = TeamParser.getManualTeamForAthlete(formattedUCIId, year)
    if (teamOverride) team = teamOverride

    return {
      participantId: shapedRecord.bibNumber?.toString(),
      bibNumber: shapedRecord.bibNumber ? +shapedRecord.bibNumber : undefined,
      firstName: shapedRecord.firstName,
      lastName: shapedRecord.lastName,
      uciId: formattedUCIId,
      team: team?.name,
      racePoints,
    }
  })

  const standingsByDates: Record<string, SerieIndividualEvent> = {}

  for (const combinedStanding of combinedStandings) {
    for (const [eventDate, points] of Object.entries(combinedStanding.racePoints)) {
      if (!standingsByDates[eventDate]) {
        standingsByDates[eventDate] = {
          date: eventDate,
          categories: {},
          published: true,
        }
      }

      if (!standingsByDates[eventDate].categories[categoryAlias]) {
        standingsByDates[eventDate].categories[categoryAlias] = {
          standings: [],
        }
      }

      standingsByDates[eventDate].categories[categoryAlias].standings.push({
        participantId: combinedStanding.participantId!,
        bibNumber: combinedStanding.bibNumber,
        firstName: combinedStanding.firstName!,
        lastName: combinedStanding.lastName!,
        uciId: combinedStanding.uciId,
        team: combinedStanding.team,
        points,
      })
    }
  }

  return Object.values(standingsByDates)
}