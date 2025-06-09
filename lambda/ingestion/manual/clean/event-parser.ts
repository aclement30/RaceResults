import _ from 'lodash'
import { parse } from 'csv-parse/sync'

import defaultLogger from '../../shared/logger.ts'
import type { AthleteRaceResult, EventAthlete, EventCategory, EventSummary } from '../../../../src/types/results.ts'
import { formatDurationToSeconds, transformOrganizer } from '../utils.ts'
import {
  capitalize,
  formatCategoryAlias, formatProvince, formatTeamName,
  transformCategory
} from '../../shared/utils.ts'
import { PROVIDER_NAME } from '../config.ts'
import type { CleanAthleteRaceResult, CleanEventAthlete, CleanEventWithResults } from '../../shared/types.ts'
import type { ManualImportCategory, ManualImportEventFile, ManualImportRawData } from '../types.ts'
import {
  calculateBCUpgradePoints,
  calculateFieldSize, getCombinedRaceCategories,
  getSanctionedEventType,
  hasDoubleUpgradePoints,
  hasUpgradePoints
} from '../../shared/upgrade-points.ts'

const logger = defaultLogger.child({ provider: PROVIDER_NAME })

export const parseEvent = (eventBundle: ManualImportEventFile, payloads: ManualImportRawData['payloads']): CleanEventWithResults => {
  logger.info(`Importing event results for: ${eventBundle.name}`)

  const organizerObj = transformOrganizer(eventBundle.organizer)

  const sanctionedEventType = getSanctionedEventType({
    organizerAlias: organizerObj.organizerAlias,
    serie: eventBundle.series,
    name: eventBundle.name
  })

  const eventSummary: Omit<EventSummary, 'categories'> = {
    hash: eventBundle.hash,
    year: eventBundle.year,
    date: eventBundle.date,
    type: 'event',
    ...organizerObj,
    name: eventBundle.name,
    serie: eventBundle.series,
    provider: PROVIDER_NAME,
    isTimeTrial: eventBundle.isTimeTrial || false,
    sanctionedEventType,
    hasUpgradePoints: hasUpgradePoints(sanctionedEventType),
    isDoubleUpgradePoints: hasDoubleUpgradePoints(sanctionedEventType),
  }

  let combinedAthletes: Record<string, EventAthlete> = {}
  let combinedEventCategories: Record<string, EventCategory> = {}

  eventBundle.categories.forEach(importCategory => {
    const matchingFile = payloads[importCategory.filename]

    if (!matchingFile) throw new Error(`No matching file found for: ${importCategory.filename} (${importCategory.outputLabel})`)

    const { athletes, results } = parseCategoryResults(matchingFile, eventBundle.fields, importCategory)
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

  if (eventSummary.hasUpgradePoints) {
    // Calculate upgrade points for each category
    combinedEventCategories = _.mapValues(combinedEventCategories, (category: EventCategory, categoryAlias: string) => {
      const fieldSize = calculateFieldSize(eventBundle.hash, categoryAlias, combinedEventCategories)

      // Calculate upgrade points for each result
      const resultsWithUpgradePoints: CleanAthleteRaceResult[] = category.results.map((result) => {
        const upgradePoints = calculateBCUpgradePoints({
          position: result.position,
          fieldSize,
          eventType: sanctionedEventType,
        })

        return {
          ...result,
          upgradePoints,
        }
      })

      return {
        ...category,
        results: resultsWithUpgradePoints,
        fieldSize,
        combinedCategories: getCombinedRaceCategories(eventBundle.hash, categoryAlias),
      } as EventCategory
    })
  }

  return {
    ...eventSummary,
    athletes: combinedAthletes,
    results: combinedEventCategories,
    sourceUrls: eventBundle.sourceUrls || [],
    raceNotes: eventBundle.raceNotes?.length ? eventBundle.raceNotes.replace(/\n/g, '<br />') : '',
    lastUpdated: eventBundle.lastUpdated,
  }
}

const parseCategoryResults = (csvData: string, fields: Record<string, string>, importCategory: ManualImportCategory): {
  athletes: Record<string, EventAthlete>,
  results: AthleteRaceResult[]
} => {
  logger.info(`Parsing category results for: ${importCategory.outputLabel}`)

  const inputRecords = parse(csvData, {
    columns: true,
    skip_empty_lines: true
  })

  // Transform records to series results
  const athletes: Record<string, CleanEventAthlete> = {}
  const categoryResults: CleanAthleteRaceResult[] = []

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
      firstName: capitalize(shapedRecord.firstName),
      lastName: capitalize(shapedRecord.lastName),
      license: shapedRecord.license?.toUpperCase(),
      uciId: shapedRecord.uciId?.replace(/\s/g, '').trim(),
      team: formatTeamName(shapedRecord.team) || null,
      age: shapedRecord.age ? +shapedRecord.age : undefined,
      city: shapedRecord.city || null,
      province: shapedRecord.state ? formatProvince(shapedRecord.state) : null,
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