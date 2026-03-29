import { formatCategoryAlias, transformCategoryLabel as defaultTransformCategory } from 'shared/categories'
import { getRaceType, getSanctionedEventType } from 'shared/events'
import defaultLogger from 'shared/logger.ts'
import { TeamParser } from 'shared/team-parser'
import type {
  CreateEventCategory,
  CreateEventResults,
  ParticipantResult,
  TParticipantStatus,
  UpdateEvent
} from 'shared/types.ts'
import { calculateBCUpgradePoints, calculateFieldSize, hasUpgradePoints, } from 'shared/upgrade-points'
import { capitalize, } from 'shared/utils'
import { PROVIDER_NAME } from '../../../config.ts'
import type { ManualImportBaseFile, ManualImportRawData } from '../../../types.ts'
import { formatDurationToSeconds } from '../../../utils.ts'
import { PARSER_NAME } from './config.ts'

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

export const parseRawEvent = async (
  eventBundle: ManualImportRaceResultsEventFile,
  payloads: ManualImportRawData['payloads']
): Promise<{ event: UpdateEvent, eventResults: CreateEventResults }> => {
  logger.info(`Importing event results for: ${eventBundle.name}`)

  const sanctionedEventType = await getSanctionedEventType({
    eventName: eventBundle.name,
    organizerAlias: eventBundle.organizer,
    year: eventBundle.year,
    serieAlias: eventBundle.series,
  })

  const event: UpdateEvent = {
    hash: eventBundle.hash,
    date: eventBundle.date,
    discipline: 'ROAD',
    location: eventBundle.location,
    organizerAlias: eventBundle.organizer,
    name: eventBundle.name,
    serie: eventBundle.series || null,
    sanctionedEventType,
    raceType: null,
    sourceUrls: eventBundle.sourceUrls || [],
    // Metadata
    provider: eventBundle.provider || PROVIDER_NAME,
    updatedAt: eventBundle.lastUpdated,
    published: true,
  }

  event.raceType = await getRaceType({ ...event, isTimeTrial: eventBundle.isTimeTrial || false })

  logger.info(`Parsing athlete results for: ${eventBundle.name}`)

  let allEventCategories = await parseParticipantResults(payloads[eventBundle.filename])

  if (hasUpgradePoints(sanctionedEventType)) {
    const parentCategories = allEventCategories.reduce((acc, category) => {
      if (category.parentCategory) acc.add(category.alias)
      return acc
    }, new Set<string>())

    // Calculate upgrade points for each category
    allEventCategories = allEventCategories.map((category) => {
      // Dont calculate upgrade points for parent categories
      if (parentCategories.has(category.alias)) return category

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
      }
    })
  }

  // Add last updated timestamp to each category
  allEventCategories = allEventCategories.map(category => ({
    ...category,
    updatedAt: eventBundle.lastUpdated,
  }))

  return {
    event,
    eventResults: {
      hash: event.hash,
      categories: allEventCategories,
    }
  }
}

const parseParticipantResults = async (jsonData: string): Promise<CreateEventCategory[]> => {
  const rawResults = JSON.parse(jsonData) as RaceResultsRawData[]

  // Transform records to series results
  const categoriesResults: Record<string, ParticipantResult[]> = {}
  const categoryLabels: Record<string, string> = {}
  const categoryStarters: Record<string, number> = {}

  for (const record of rawResults) {
    const categoryLabel = await transformCategoryLabel(record.RaceCategoryName)
    const categoryAlias = formatCategoryAlias(record.RaceCategoryName)
    categoryLabels[categoryAlias] = categoryLabel

    if (!record.RacerID) {
      logger.warn(`Skipping record with missing RacerID: ${JSON.stringify(record)}`)
      continue
    }

    const team = TeamParser.parseTeamName(record.TeamName)

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
    let finishGap // will be calculated later
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
      participantId: record.RacerID.toString(),
      // Demographic data
      firstName: capitalize(record.FirstName),
      lastName: capitalize(record.LastName),
      license: record.License?.length && record.License?.toUpperCase() || undefined,
      team: team?.name,
      // Finish position
      position,
      status: status as TParticipantStatus,
      // Timing data
      finishTime,
      finishGap, // will be calculated later
    })
  }

  return Object.entries(categoriesResults).map(([alias, results]) => {
    const categoryLabel = categoryLabels[alias]
    const categoryGender: 'M' | 'F' | 'X' = categoryLabel.toLowerCase().includes('(m)') ? 'M' : categoryLabel.toLowerCase().includes('(w)') ? 'F' : 'X'
    const starters = categoryStarters[alias]
    const finishers = results.filter(r => r.status === 'FINISHER').length

    const finisherGaps = calculateFinishGaps(results)

    results.forEach(result => {
      if (result.status === 'FINISHER' && result.finishTime && result.finishTime > 0 && !result.finishGap) {
        result.finishGap = finisherGaps[result.participantId]
      }
    })

    return {
      alias,
      label: categoryLabel,
      gender: categoryGender,
      results,
      starters,
      finishers,
      primes: [], // No prime data available in this source
      upgradePoints: null, // Upgrade points will be calculated later, if applicable
    }
  })
}

const calculateFinishGaps = (results: ParticipantResult[]): Record<string, number> => {
  const finishers = results
  .filter(r => r.status === 'FINISHER' && r.finishTime && r.finishTime > 0)
  .sort((
    a,
    b
  ) => a.finishTime! - b.finishTime!)

  if (finishers.length === 0) return {}

  const firstFinisherTime = finishers[0].finishTime!

  const finisherGaps: Record<string, number> = {}

  finishers.forEach(result => {
    if (result.status === 'FINISHER' && result.finishTime && result.finishTime > 0) finisherGaps[result.participantId] = result.finishTime - firstFinisherTime
  })

  return finisherGaps
}

const transformCategoryLabel = (
  catName: string,
): Promise<string> => {
  let newLabel

  if (catName.startsWith('Men Senior')) newLabel = catName.replace('Men Senior', '').trim() + ' (M)'
  if (catName.startsWith('Men Pro/Cat')) newLabel = catName.replace('Men Pro/Cat', 'Cat').trim() + ' (M)'
  if (catName.startsWith('Men')) newLabel = catName.replace('Men', '').trim() + ' (M)'
  if (catName.startsWith('Women Senior')) newLabel = catName.replace('Women Senior', '').trim() + ' (W)'
  if (catName.startsWith('Women')) newLabel = catName.replace('Women', '').trim() + ' (W)'

  if (newLabel) return Promise.resolve(newLabel)

  return defaultTransformCategory(catName)
}