import _ from 'lodash'
import { parse } from 'csv-parse/sync'

import defaultLogger from '../../../../shared/logger.ts'
import type {
  EventCategory,
  EventSummary
} from '../../../../../../src/types/results.ts'
import { formatAthleteName, formatDurationToSeconds, transformOrganizer } from '../../../utils.ts'
import {
  createUmbrellaCategories,
  formatCategoryAlias, formatProvince,
  transformCategory
} from '../../../../shared/utils.ts'
import { PROVIDER_NAME } from '../../../config.ts'
import type { CleanAthleteRaceResult, CleanEventAthlete, CleanEventWithResults } from '../../../../shared/types.ts'
import type { ManualImportCategory, ManualImportEventFile, ManualImportRawData } from '../../../types.ts'
import {
  calculateBCUpgradePoints,
  calculateFieldSize,
  getSanctionedEventType,
  hasDoubleUpgradePoints,
  hasUpgradePoints
} from '../../../../shared/upgrade-points.ts'
import { getCombinedRaceCategories } from '../../../../cross-mgr/utils.ts'
import { TeamParser } from '../../../../shared/team-parser.ts'

const logger = defaultLogger.child({ provider: PROVIDER_NAME })

export const parseEvent = (
  eventBundle: ManualImportEventFile,
  payloads: ManualImportRawData['payloads']
): CleanEventWithResults => {
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
    discipline: 'ROAD',
    location: eventBundle.location,
    ...organizerObj,
    name: eventBundle.name,
    serie: eventBundle.series,
    provider: PROVIDER_NAME,
    isTimeTrial: eventBundle.isTimeTrial || false,
    sanctionedEventType,
    hasUpgradePoints: hasUpgradePoints(sanctionedEventType),
    isDoubleUpgradePoints: hasDoubleUpgradePoints(sanctionedEventType),
  }

  let allEventAthletes: Record<string, CleanEventAthlete> = {}
  let allEventCategories: CleanEventWithResults['results'] = {}

  eventBundle.categories.forEach(importCategory => {
    const matchingFile = payloads[importCategory.filename]

    if (!matchingFile) throw new Error(`No matching file found for: ${importCategory.filename} (${importCategory.outputLabel})`)

    const { athletes, results } = parseCategoryResults(matchingFile, eventBundle.fields, importCategory)
    const categoryGender = importCategory.outputLabel.includes('Men') ? 'M' : importCategory.outputLabel.includes('Women') ? 'F' : 'X'
    const categoryLabel = transformCategory(importCategory.outputLabel)
    const alias = formatCategoryAlias(categoryLabel)

    allEventAthletes = {
      ...allEventAthletes,
      ...athletes,
    }

    const starters = results.filter(r => r.status !== 'DNS').length
    const finishers = results.filter(r => r.status === 'FINISHER').length

    allEventCategories[alias] = {
      alias,
      label: categoryLabel,
      gender: categoryGender,
      results,
      starters,
      finishers,
      distanceUnit: 'km',
      raceDistance: importCategory.distance,
    }
  })

  // Check if some categories are combined
  const combinedCategoryGroups = getCombinedRaceCategories(eventBundle)

  // Create umbrella categories for combined categories
  allEventCategories = createUmbrellaCategories(allEventCategories, combinedCategoryGroups)

  if (eventSummary.hasUpgradePoints) {
    // Calculate upgrade points for each category
    allEventCategories = _.mapValues(allEventCategories, (category: EventCategory, categoryAlias: string) => {
      // Dont calculate upgrade points for umbrella categories
      if (category.combinedCategories) return category

      const categoryGroup = combinedCategoryGroups.find(group => group.categories.some(c => c === categoryAlias))
      const combinedCategories = categoryGroup?.categories.map(alias => allEventCategories[alias]) || [category]
      const fieldSize = calculateFieldSize(combinedCategories)

      // Calculate upgrade points for the category/combined categories
      const upgradePoints = calculateBCUpgradePoints({
        category,
        fieldSize,
        eventType: sanctionedEventType,
      })

      return {
        ...category,
        fieldSize,
        upgradePoints,
      } as EventCategory
    })
  }

  return {
    ...eventSummary,
    athletes: allEventAthletes,
    results: allEventCategories,
    sourceUrls: eventBundle.sourceUrls || [],
    raceNotes: eventBundle.raceNotes?.length ? eventBundle.raceNotes.replace(/\n/g, '<br />') : '',
    lastUpdated: eventBundle.lastUpdated,
  }
}

const parseCategoryResults = (csvData: string, fields: Record<string, string>, importCategory: ManualImportCategory): {
  athletes: Record<string, CleanEventAthlete>,
  results: CleanAthleteRaceResult[]
} => {
  logger.info(`Parsing category results for: ${importCategory.outputLabel}`)

  const inputRecords = parse(csvData, {
    columns: true,
    skip_empty_lines: true
  })

  // Transform records to series results
  const athletes: Record<string, CleanEventAthlete> = {}
  const categoryResults: CleanAthleteRaceResult[] = []
  const categoryAlias = formatCategoryAlias(importCategory.outputLabel)

  inputRecords.forEach((record: Record<string, string>) => {
    const shapedRecord: Record<string, string> = Object.keys(record).reduce((acc, inputField) => {
      const outputField = fields[_.camelCase(inputField)]
      const value = record[inputField]
      if (outputField) acc[outputField] = value
      return acc
    }, {} as Record<string, any>)

    if (Object.keys(shapedRecord).length === 0) {
      logger.error(`Invalid fields mapping`, { record, fields })
      return
    }

    const bibNumber = +shapedRecord.bibNumber

    let firstName
    let lastName
    try {
      ({ firstName, lastName } = formatAthleteName(shapedRecord as {
        firstName: string,
        lastName: string
      }))
    } catch (error) {
      logger.error(`Error formatting athlete name: ${(error as any).message}`, { shapedRecord })
      return
    }

    const team = TeamParser.parseTeamName(shapedRecord.team)

    athletes[bibNumber] = {
      bibNumber,
      firstName,
      lastName,
      license: shapedRecord.license?.toUpperCase(),
      uciId: shapedRecord.uciId?.replace(/\s/g, '').trim(),
      team: team?.name,
      age: shapedRecord.age ? +shapedRecord.age : undefined,
      city: shapedRecord.city,
      province: formatProvince(shapedRecord.state),
      eventCategories: [categoryAlias],
    }

    let position = -1
    let status = 'FINISHER'

    if (shapedRecord.position && shapedRecord.position.match(/^\d+$/)) {
      position = +shapedRecord.position
    } else {
      status = shapedRecord.position?.toUpperCase()
    }

    categoryResults.push({
      athleteId: bibNumber.toString(),
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