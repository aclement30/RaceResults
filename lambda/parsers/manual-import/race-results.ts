import { parse } from 'csv-parse/sync'
import type { ManualImportCategory, ManualImportEventFile } from './types.ts'
import type {
  Athlete, AthleteRaceResult, EventCategory, EventSummary,
} from '../../../src/types/results.ts'
import defaultLogger from '../shared/logger.ts'
import {
  formatCategoryAlias,
  getBaseCategories,
  sortByCategory,
} from '../shared/utils.ts'
import { fetchFile } from './aws-s3.ts'
import { formatDurationToSeconds, transformOrganizer } from './utils.ts'
import _ from 'lodash'

const logger = defaultLogger.child({ provider: 'manual-import' })

export async function importEventResults(manualImportEvent: Omit<ManualImportEventFile, 'files'>, sourceFiles: string[]) {
  const fileContents: Record<string, string> = {}

  logger.info(`Importing event results for: ${manualImportEvent.name}`)

  for (const filename of sourceFiles) {
    const fileContent = await fetchFile(filename)

    if (!fileContent) throw new Error(`File ${filename} not found!`)

    const basename = filename!.split('/').pop()!
    fileContents[basename] = fileContent
  }

  const eventSummary: EventSummary = {
    hash: manualImportEvent.hash,
    year: manualImportEvent.year,
    date: manualImportEvent.date,
    ...transformOrganizer(manualImportEvent.organizer),
    name: manualImportEvent.name,
    series: manualImportEvent.series,
    provider: 'manual-import',
    isTimeTrial: manualImportEvent.isTimeTrial || false,
    categories: [],
  }

  let combinedAthletes: Record<string, Athlete> = {}
  let combinedEventCategories: Record<string, EventCategory> = {}

  manualImportEvent.categories.forEach(importCategory => {
    const matchingFile = fileContents[importCategory.filename]

    if (!matchingFile) throw new Error(`No matching file found for: ${importCategory.filename} (${importCategory.outputLabel})`)

    const { athletes, results } = parseCategoryResults(matchingFile, manualImportEvent.fields, importCategory)
    const categoryGender = importCategory.outputLabel.includes('Men') ? 'M' : importCategory.outputLabel.includes('Women') ? 'F' : 'X'
    const categoryLabel = transformCategory(importCategory.outputLabel)
    const alias = formatCategoryAlias(categoryLabel)

    combinedAthletes = {
      ...combinedAthletes,
      ...athletes,
    }

    const starters = results.filter(r => r.status !== 'DNS').length
    const finishers = results.filter(r => r.status === 'FINISHER').length

    combinedEventCategories[alias] = {
      alias,
      label: categoryLabel,
      gender: categoryGender,
      results,
      starters,
      finishers,
      distanceUnit: 'km',
      raceDistance: importCategory.distance,
      startOffset: 0,
    }
  })

  const baseCategories = getBaseCategories(combinedEventCategories).sort(sortByCategory)

  return {
    summary: {
      ...eventSummary,
      categories: baseCategories,
    },
    results: {
      hash: eventSummary.hash,
      athletes: combinedAthletes,
      results: combinedEventCategories,
      lastUpdated: manualImportEvent.lastUpdated,
      raceNotes: manualImportEvent.raceNotes?.length ? manualImportEvent.raceNotes.replace(/\n/g, '<br />') : '',
      sourceUrls: manualImportEvent.sourceUrls || [],
    },
    type: 'event',
  }
}

function parseCategoryResults(csvData: string, fields: Record<string, string>, importCategory: ManualImportCategory): {
  athletes: Record<string, Athlete>,
  results: AthleteRaceResult[]
} {
  logger.info(`Parsing category results for: ${importCategory.outputLabel}`)

  const inputRecords = parse(csvData, {
    columns: true,
    skip_empty_lines: true
  })

  // Transform records to series results
  const athletes: Record<string, Athlete> = {}
  const categoryResults: AthleteRaceResult[] = []

  inputRecords.forEach((record: Record<string, string>) => {
    const shapedRecord: Record<string, string> = Object.keys(record).reduce((acc, inputField) => {
      const outputField = fields[_.camelCase(inputField)]
      const value = record[inputField]
      if (outputField) acc[outputField] = value
      return acc
    }, {} as Record<string, any>)

    const bibNumber = +shapedRecord.bibNumber

    athletes[bibNumber] = {
      bibNumber,
      firstName: shapedRecord.firstName,
      lastName: shapedRecord.lastName,
      license: shapedRecord.license,
      uciId: shapedRecord.uciId,
      team: shapedRecord.team,
      age: shapedRecord.age ? +shapedRecord.age : undefined,
      city: shapedRecord.city,
      state: shapedRecord.state?.replace('British Columbia', 'BC') || null,
    }

    let position = -1
    let status = 'FINISHER'

    if (shapedRecord.position && shapedRecord.position.match(/^\d+$/)) {
      position = +shapedRecord.position
    } else {
      status = shapedRecord.position.toUpperCase()
    }

    categoryResults.push({
      bibNumber,
      position,
      status: status as any,
      finishTime: shapedRecord.finishTime ? formatDurationToSeconds(shapedRecord.finishTime) : 0,
      finishGap: shapedRecord.finishGap ? formatDurationToSeconds(shapedRecord.finishGap) : 0,
      avgSpeed: shapedRecord.avgSpeed ? +shapedRecord.avgSpeed.replace('km/h', '').trim() : 0,
    })
  })

  return {
    athletes,
    results: categoryResults,
  }
}

const transformCategory = (catName: string): string => {
  return catName.replace('(Men)', '(M)').replace('(Women)', '(W)')
}