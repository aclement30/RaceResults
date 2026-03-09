import { parse } from 'csv-parse/sync'
import { camelCase } from 'lodash-es'
import { mapValues } from 'lodash-es'
import defaultLogger from '../../../../../shared/logger.ts'
import type {
  AthleteRaceResult,
  EventAthlete,
  EventCategory, EventResults,
  RaceEvent
} from '../../../../../../src/types/results.ts'
import { formatAthleteName, formatDurationToSeconds, transformOrganizer } from '../../../utils.ts'
import {
  createUmbrellaCategories,
  formatCategoryAlias, formatProvince, getBaseCategories,
  getCombinedRaceCategories, shapeCategoriesResults,
  transformCategory
} from '../../../../../shared/utils.ts'
import { PROVIDER_NAME } from '../../../config.ts'
import type { ManualImportCategory, ManualImportEventFile, ManualImportRawData } from '../../../types.ts'
import {
  calculateBCUpgradePoints,
  calculateFieldSize,
  getSanctionedEventType,
  hasDoubleUpgradePoints,
  hasUpgradePoints
} from '../../../../../shared/upgrade-points.ts'
import { TeamParser } from '../../../../../shared/team-parser.ts'
import type { AthleteManualEdit } from '../../../../../shared/types.ts'

const logger = defaultLogger.child({ provider: PROVIDER_NAME })

export const parseRawEvent = (
  eventBundle: ManualImportEventFile,
  payloads: ManualImportRawData['payloads'],
): { event: RaceEvent, eventResults: EventResults } => {
  logger.info(`Importing event results for: ${eventBundle.name}`)

  const organizerObj = transformOrganizer(eventBundle.organizer)

  const sanctionedEventType = getSanctionedEventType({
    organizerAlias: organizerObj.organizerAlias,
    serie: eventBundle.series,
    name: eventBundle.name,
    year: eventBundle.year,
  })

  const event: RaceEvent = {
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
    categories: [],
    lastUpdated: eventBundle.lastUpdated,
  }

  let allEventAthletes: Record<string, EventAthlete> = {}
  let allEventCategories: EventResults['results'] = {}

  if (!eventBundle.categories) throw new Error('No categories provided for event!')

  eventBundle.categories.forEach(importCategory => {
    const matchingFile = payloads[importCategory.filename]

    if (!matchingFile) throw new Error(`No matching file found for: ${importCategory.filename} (${importCategory.outputLabel})`)

    const { athletes, results, corrections } = parseCategoryResults(matchingFile, {
      fields: eventBundle.fields,
      importCategory,
      year: eventBundle.year,
    })
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
      corrections,
    }
  })

  // Check if some categories are combined
  const combinedCategoryGroups = getCombinedRaceCategories(event)

  // Create umbrella categories for combined categories
  const {
    categories: updatedCategories,
    errors: umbrellaCategoriesErrors
  } = createUmbrellaCategories(allEventCategories, combinedCategoryGroups)

  allEventCategories = updatedCategories
  if (umbrellaCategoriesErrors?.length) {
    umbrellaCategoriesErrors.forEach(error => {
      logger.warn(error, {
        provider: PROVIDER_NAME,
        eventHash: eventBundle.hash,
        year: eventBundle.year,
      })
    })
  }

  // Clean athlete event categories (remove deleted categories & umbrella categories)
  // allEventAthletes = mapValues(allEventAthletes, (athlete) => ({
  //   ...athlete,
  //   eventCategories: athlete.eventCategories.filter(catAlias => !!allEventCategories[catAlias] && !allEventCategories[catAlias].combinedCategories),
  // }))

  if (event.hasUpgradePoints) {
    // Calculate upgrade points for each category
    allEventCategories = mapValues(allEventCategories, (category: EventCategory, categoryAlias: string) => {
      let categoryGroup
      let fieldSize

      if (category.combinedCategories) {
        categoryGroup = combinedCategoryGroups.find(group => group.umbrellaCategory === category.alias)

        // Dont calculate upgrade points for umbrella categories, unless specified
        if (categoryGroup?.categoriesForPoints !== 'UMBRELLA') return category

        const combinedCategories = [category]
        fieldSize = calculateFieldSize(combinedCategories)
      } else {
        categoryGroup = combinedCategoryGroups.find(group => group.categories.some(c => c === categoryAlias))

        // Dont calculate upgrade points for combined categories, unless specified
        if (categoryGroup?.categoriesForPoints === 'UMBRELLA') return category

        const combinedCategories = categoryGroup?.categories.map(alias => allEventCategories[alias]) || [category]
        fieldSize = calculateFieldSize(combinedCategories)
      }

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

  event.categories = getBaseCategories(allEventCategories, { organizerAlias: event.organizerAlias, serie: event.serie })

  return {
    event,
    eventResults: {
      hash: event.hash,
      athletes: allEventAthletes,
      results: shapeCategoriesResults(allEventCategories),
      sourceUrls: eventBundle.sourceUrls || [],
      raceNotes: eventBundle.raceNotes?.length ? eventBundle.raceNotes.replace(/\n/g, '<br />') : '',
      lastUpdated: eventBundle.lastUpdated,
    }
  }
}

const parseCategoryResults = (
  csvData: string,
  { fields, importCategory, year }:
  {
    fields: Record<string, string>,
    importCategory: ManualImportCategory,
    year: number,
  }
): {
  athletes: Record<string, EventAthlete>,
  results: AthleteRaceResult[],
  corrections: string | undefined
} => {
  logger.info(`Parsing category results for: ${importCategory.outputLabel}`)

  const inputRecords = parse(csvData, {
    columns: true,
    skip_empty_lines: true
  }) as Record<string, string>[]

  // Transform records to series results
  const athletes: Record<string, EventAthlete> = {}
  const categoryResults: AthleteRaceResult[] = []
  const categoryAlias = formatCategoryAlias(importCategory.outputLabel)

  inputRecords.forEach((record) => {
    const shapedRecord: Record<string, string> = Object.keys(record).reduce((acc, inputField) => {
      const outputField = fields[camelCase(inputField)]
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
        lastName: string,
        name: string,
      }))
    } catch (error) {
      logger.error(`Error formatting athlete name: ${(error as any).message}`, { shapedRecord })
      return
    }

    const formattedUCIId = shapedRecord.uciId?.replace(/\s/g, '').trim()
    let team = TeamParser.parseTeamName(shapedRecord.team)
    // If athlete has an override for the current year team, use that instead
    const teamOverride = TeamParser.getManualTeamForAthlete(formattedUCIId, year)
    if (teamOverride) {
      team = teamOverride
    }

    athletes[bibNumber] = {
      bibNumber,
      firstName,
      lastName,
      license: shapedRecord.license?.toUpperCase(),
      uciId: formattedUCIId,
      team: team?.name,
      age: shapedRecord.age ? +shapedRecord.age : undefined,
      city: shapedRecord.city,
      province: formatProvince(shapedRecord.state || shapedRecord.province),
      // eventCategories: [categoryAlias],
    }

    let position = -1
    let status = 'FINISHER'

    if (shapedRecord.position && shapedRecord.position.match(/^\d+$/)) {
      position = +shapedRecord.position
    } else {
      status = shapedRecord.position?.toUpperCase()
    }

    let finishTime = 0
    let finishGap = null
    if (shapedRecord.finishTime?.match(/^-(\d+)\slaps?$/i)) {
      finishGap = +shapedRecord.finishTime.match(/^-(\d+)\slaps?$/i)![1] * -1
    } else if (shapedRecord.finishTime?.match(/^[A-Z]+$/)) {
      status = shapedRecord.finishTime.toUpperCase()
    } else {
      finishTime = shapedRecord.finishTime ? formatDurationToSeconds(shapedRecord.finishTime) : 0
    }
    if (shapedRecord.finishGap) {
      finishGap = formatDurationToSeconds(shapedRecord.finishGap)
    }

    categoryResults.push({
      athleteId: bibNumber.toString(),
      bibNumber,
      position,
      status: status as any,
      finishTime,
      finishGap,
      avgSpeed: shapedRecord.avgSpeed ? +shapedRecord.avgSpeed.replace('km/h', '').trim() : 0,
    })
  })

  return {
    athletes,
    results: categoryResults,
    corrections: importCategory.corrections,
  }
}