import { mapValues } from 'lodash-es'
import type {
  ManualImportBaseFile,
  ManualImportRawData
} from '../../../types.ts'
import defaultLogger from '../../../../../shared/logger.ts'
import { PROVIDER_NAME } from '../../../config.ts'
import type {
  CleanAthleteRaceResult,
  CleanEventAthlete,
  CleanEventResults,
  CleanEventWithResults
} from '../../../../../shared/types.ts'
import { formatDurationToSeconds, transformOrganizer } from '../../../utils.ts'
import {
  calculateBCUpgradePoints,
  calculateFieldSize,
  getSanctionedEventType,
  hasDoubleUpgradePoints,
  hasUpgradePoints
} from '../../../../../shared/upgrade-points.ts'
import type { EventCategory, EventSummary, SerieSummary } from '../../../../../../src/types/results.ts'
import {
  capitalize,
  formatCategoryAlias,
  transformCategory as defaultTransformCategory,
} from '../../../../../shared/utils.ts'
import { PARSER_NAME } from './config.ts'
import { TeamParser } from '../../../../../shared/team-parser.ts'

const logger = defaultLogger.child({ provider: PROVIDER_NAME, parser: PARSER_NAME })

export type ManualImportRaceResultsEventFile = ManualImportBaseFile & {
  type: 'event'
  date: string
  series?: string
  isTimeTrial?: boolean
  filename: string
}

type RaceResultsRawData = {
  RacerID: number
  RaceName: string
  RaceCategoryName: string
  Place: number
  FirstName: string
  LastName: string
  TeamName: string
  License: string
  RaceTime: string
  IsDnf: number
  IsDQ: number
  IsDNP: number
  RacerCount: number
}

export const parseEvent = (
  eventBundle: ManualImportRaceResultsEventFile,
  payloads: ManualImportRawData['payloads']
): CleanEventWithResults => {
  logger.info(`Importing event results for: ${eventBundle.name}`)

  const organizerObj = transformOrganizer(eventBundle.organizer)

  const sanctionedEventType = getSanctionedEventType({
    organizerAlias: organizerObj.organizerAlias,
    serie: eventBundle.series,
    name: eventBundle.name,
    year: eventBundle.year,
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
    provider: eventBundle.provider || PROVIDER_NAME,
    isTimeTrial: eventBundle.isTimeTrial || false,
    sanctionedEventType,
    hasUpgradePoints: hasUpgradePoints(sanctionedEventType),
    isDoubleUpgradePoints: hasDoubleUpgradePoints(sanctionedEventType),
  }

  logger.info(`Parsing athlete results for: ${eventBundle.name}`)

  let {
    athletes: allEventAthletes,
    eventCategoriesWithResults: allEventCategories
  } = parseAthleteResults(payloads[eventBundle.filename])

  if (eventSummary.hasUpgradePoints) {
    // Calculate upgrade points for each category
    allEventCategories = mapValues(allEventCategories, (category: EventCategory, categoryAlias: string) => {
      // Dont calculate upgrade points for umbrella categories
      if (category.combinedCategories) return category

      const fieldSize = category.starters || calculateFieldSize([category])

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
    lastUpdated: eventBundle.lastUpdated,
  }
}

const parseAthleteResults = (jsonData: string): {
  athletes: Record<string, CleanEventAthlete>,
  eventCategoriesWithResults: CleanEventResults['results']
} => {
  const rawResults = JSON.parse(jsonData) as RaceResultsRawData[]

  // Transform records to series results
  const athletes: Record<string, CleanEventAthlete> = {}
  const categoriesResults: Record<string, CleanAthleteRaceResult[]> = {}
  const categoryLabels: Record<string, string> = {}
  const categoryStarters: Record<string, number> = {}

  rawResults.forEach((record) => {
    const categoryLabel = transformCategory(record.RaceCategoryName)
    const categoryAlias = formatCategoryAlias(categoryLabel)
    categoryLabels[categoryAlias] = categoryLabel

    if (!record.RacerID) {
      logger.warn(`Skipping record with missing RacerID: ${JSON.stringify(record)}`)
      return
    }

    const team = TeamParser.parseTeamName(record.TeamName)

    athletes[record.RacerID] = {
      firstName: capitalize(record.FirstName),
      lastName: capitalize(record.LastName),
      license: record.License?.length && record.License?.toUpperCase() || undefined,
      team: team?.name,
      eventCategories: [categoryAlias],
    }

    if (record.RacerCount) categoryStarters[categoryAlias] = +record.RacerCount

    let position = -1
    let status = 'FINISHER'

    if (record.IsDNP) {
      status = 'DNP'
      position = -1
    } else if (record.IsDQ) {
      status = 'DQ'
      position = -1
    } else if (record.IsDnf) {
      status = 'DNF'
      position = -1
    } else {
      position = record.Place
    }

    if (!categoriesResults[categoryAlias]) categoriesResults[categoryAlias] = []

    let finishTime = 0
    let finishGap = null // will be calculated later
    if (record.RaceTime) {
      if (record.RaceTime.match(/^[A-z]+$/)) {
        // DNF
      } else if (record.RaceTime.match(/^-(\d+)\slaps?$/i)) {
        finishGap = +record.RaceTime.match(/^-(\d+)\slaps?$/i)![1] * -1
      } else {
        finishTime = formatDurationToSeconds(record.RaceTime)
      }
    }

    categoriesResults[categoryAlias].push({
      athleteId: record.RacerID.toString(),
      position,
      status: status as any,
      finishTime,
      finishGap, // will be calculated later
    })
  })

  const allEventCategories = mapValues(categoriesResults, (results, alias) => {
    const categoryLabel = categoryLabels[alias]
    const categoryGender: 'M' | 'F' | 'X' = categoryLabel.toLowerCase().includes('(m)') ? 'M' : categoryLabel.toLowerCase().includes('(w)') ? 'F' : 'X'
    const starters = categoryStarters[alias]
    const finishers = results.filter(r => r.status === 'FINISHER').length

    const finisherGaps = calculateFinishGaps(results)

    results.forEach(result => {
      if (result.status === 'FINISHER' && result.finishTime > 0 && !result.finishGap) {
        result.finishGap = finisherGaps[result.athleteId] || null
      }
    })

    return {
      alias,
      label: categoryLabel,
      gender: categoryGender,
      results,
      starters,
      finishers,
    }
  })

  return {
    athletes,
    eventCategoriesWithResults: allEventCategories,
  }
}

export const calculateFinishGaps = (results: CleanAthleteRaceResult[]): Record<string, number> => {
  const finishers = results
  .filter(r => r.status === 'FINISHER' && r.finishTime > 0)
  .sort((
    a,
    b
  ) => a.finishTime - b.finishTime)

  if (finishers.length === 0) return {}

  const firstFinisherTime = finishers[0].finishTime

  const finisherGaps: Record<string, number> = {}

  finishers.forEach(result => {
    if (result.status === 'FINISHER' && result.finishTime > 0) finisherGaps[result.athleteId] = result.finishTime - firstFinisherTime
  })

  return finisherGaps
}

export const transformCategory = (
  catName: string,
): string => {
  if (catName.startsWith('Men Senior')) return catName.replace('Men Senior', '').trim() + ' (M)'
  if (catName.startsWith('Men Pro/Cat')) return catName.replace('Men Pro/Cat', 'Cat').trim() + ' (M)'
  if (catName.startsWith('Men')) return catName.replace('Men', '').trim() + ' (M)'
  if (catName.startsWith('Women Senior')) return catName.replace('Women Senior', '').trim() + ' (W)'
  if (catName.startsWith('Women')) return catName.replace('Women', '').trim() + ' (W)'

  return defaultTransformCategory(catName)
}