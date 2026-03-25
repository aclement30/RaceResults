import { parse } from 'csv-parse/sync'
import { camelCase } from 'lodash-es'
import {
  createUmbrellaCategories,
  formatCategoryAlias,
  getCombinedRaceCategories,
  transformCategoryLabel
} from 'shared/categories'
import { getRaceType, getSanctionedEventType } from 'shared/events'
import defaultLogger from 'shared/logger.ts'
import { TeamParser } from 'shared/team-parser'
import type {
  CreateEventCategory,
  CreateEventResults,
  ParticipantResult,
  TParticipantStatus,
  UpdateEvent,
} from 'shared/types.ts'
import { calculateBCUpgradePoints, calculateFieldSize, hasUpgradePoints, } from 'shared/upgrade-points'
import { formatProvince, formatStatus } from 'shared/utils'
import { PROVIDER_NAME } from '../../../config.ts'
import type { ManualImportCategory, ManualImportEventFile, ManualImportRawData } from '../../../types.ts'
import { formatAthleteName, formatDurationToSeconds } from '../../../utils.ts'

const logger = defaultLogger.child({ provider: PROVIDER_NAME })

export const parseRawEvent = async (
  eventBundle: ManualImportEventFile,
  payloads: ManualImportRawData['payloads'],
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
    raceNotes: eventBundle.raceNotes?.length ? eventBundle.raceNotes.replace(/\n/g, '<br />') : '',
    // Metadata
    provider: PROVIDER_NAME,
    updatedAt: eventBundle.lastUpdated,
    published: true,
  }

  event.raceType = await getRaceType({ ...event, isTimeTrial: eventBundle.isTimeTrial || false })

  let allEventCategories: CreateEventCategory[] = []

  if (!eventBundle.categories) throw new Error('No categories provided for event!')

  for (const importCategory of eventBundle.categories) {
    const matchingFile = payloads[importCategory.filename]

    if (!matchingFile) throw new Error(`No matching file found for: ${importCategory.filename} (${importCategory.outputLabel})`)

    const { results, corrections } = parseCategoryResults(matchingFile, {
      fields: eventBundle.fields,
      importCategory,
      year: eventBundle.year,
    })
    const categoryGender = importCategory.outputLabel.includes('Men') ? 'M' : importCategory.outputLabel.includes('Women') ? 'F' : 'X'
    const categoryLabel = await transformCategoryLabel(importCategory.outputLabel)
    const alias = formatCategoryAlias(importCategory.outputLabel)

    const starters = results.filter(r => r.status !== 'DNS').length
    const finishers = results.filter(r => r.status === 'FINISHER').length

    allEventCategories.push({
      alias,
      label: categoryLabel,
      gender: categoryGender,
      results,
      starters,
      finishers,
      raceDistanceKm: importCategory.distance,
      corrections,
      primes: [],
      upgradePoints: null,
      updatedAt: eventBundle.lastUpdated,
    })
  }

  // Check if some categories are combined
  const combinedCategoryGroups = await getCombinedRaceCategories({
    eventHash: event.hash,
    serieAlias: event.serie,
    organizerAlias: event.organizerAlias,
    eventName: event.name,
    year: eventBundle.year,
  })

  // Create parent categories for combined categories
  const {
    categories: updatedCategories,
    errors: parentCategoryErrors
  } = createUmbrellaCategories(allEventCategories, combinedCategoryGroups)

  allEventCategories = updatedCategories
  if (parentCategoryErrors?.length) {
    parentCategoryErrors.forEach(error => {
      logger.warn(error, {
        provider: PROVIDER_NAME,
        eventHash: eventBundle.hash,
        year: eventBundle.year,
      })
    })
  }

  if (hasUpgradePoints(sanctionedEventType)) {
    const parentCategories = allEventCategories.reduce((acc, category) => {
      if (category.parentCategory) acc.add(category.alias)
      return acc
    }, new Set<string>())

    // Calculate upgrade points for each category
    allEventCategories = allEventCategories.map((category) => {
      let categoryGroup
      let fieldSize

      if (parentCategories.has(category.alias)) {
        categoryGroup = combinedCategoryGroups.find(group => group.parentCategory === category.alias)

        // Dont calculate upgrade points for parent categories, unless specified
        if (categoryGroup?.categoriesForPoints !== 'PARENT') return category

        const subCategories = [category]
        fieldSize = calculateFieldSize(subCategories)
      } else {
        categoryGroup = combinedCategoryGroups.find(group => group.categories.some(c => c === category.alias))

        // Dont calculate upgrade points for combined categories, unless specified
        if (categoryGroup?.categoriesForPoints === 'PARENT') return category

        const subCategories = categoryGroup?.categories.map(alias => allEventCategories.find(c => c.alias === alias)!) || [category]
        fieldSize = calculateFieldSize(subCategories)
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
      }
    })
  }

  return {
    event,
    eventResults: {
      hash: event.hash,
      categories: allEventCategories,
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
  results: ParticipantResult[],
  corrections: string | undefined
} => {
  logger.info(`Parsing category results for: ${importCategory.outputLabel}`)

  const inputRecords = parse(csvData, {
    columns: true,
    skip_empty_lines: true
  }) as Record<string, string>[]

  // Transform records to series results
  const participantResults: ParticipantResult[] = []

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

    let position = -1
    let status: TParticipantStatus | null = 'FINISHER'

    if (shapedRecord.position && shapedRecord.position.match(/^\d+$/)) {
      position = +shapedRecord.position
    } else {
      status = formatStatus(shapedRecord.position)
    }

    let finishTime = 0
    let finishGap = null
    if (shapedRecord.finishTime?.match(/^-(\d+)\slaps?$/i)) {
      finishGap = +shapedRecord.finishTime.match(/^-(\d+)\slaps?$/i)![1] * -1
    } else if (shapedRecord.finishTime?.match(/^[A-Z]+$/)) {
      status = formatStatus(shapedRecord.finishTime)
    } else {
      finishTime = shapedRecord.finishTime ? formatDurationToSeconds(shapedRecord.finishTime) : 0
    }
    if (shapedRecord.finishGap) {
      finishGap = formatDurationToSeconds(shapedRecord.finishGap)
    }

    participantResults.push({
      participantId: bibNumber.toString(),
      bibNumber,
      // Demographic data
      firstName,
      lastName,
      license: shapedRecord.license?.toUpperCase(),
      uciId: formattedUCIId,
      team: team?.name,
      age: shapedRecord.age ? +shapedRecord.age : undefined,
      city: shapedRecord.city,
      province: formatProvince(shapedRecord.state || shapedRecord.province),
      // Finish position
      position,
      status,
      // Timing data
      finishTime,
      finishGap: finishGap || undefined,
      avgSpeed: shapedRecord.avgSpeed ? +shapedRecord.avgSpeed.replace('km/h', '').trim() : 0,
    })
  })

  return {
    results: participantResults,
    corrections: importCategory.corrections,
  }
}