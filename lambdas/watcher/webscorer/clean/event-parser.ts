import * as cheerio from 'cheerio'
import shortHash from 'short-hash'
import { omitBy } from 'lodash-es'
import { mapValues } from 'lodash-es'
import type {
  CleanAthleteRaceResult,
  CleanEventAthlete,
  CleanEventWithResults
} from '../../../shared/types.ts'
import {
  calculateBCUpgradePoints,
  calculateFieldSize,
  getSanctionedEventType,
  hasDoubleUpgradePoints,
  hasUpgradePoints
} from '../../../shared/upgrade-points.ts'
import type { EventCategory, EventSummary } from '../../../../src/types/results.ts'
import {
  capitalize,
  createUmbrellaCategories,
  formatCategoryAlias,
  getCombinedRaceCategories
} from '../../../shared/utils.ts'
import { TeamParser } from '../../../shared/team-parser.ts'
import defaultLogger from '../../../shared/logger.ts'
import { PROVIDER_NAME } from '../config.ts'
import type { WebscorerEvent } from '../types.ts'
import { getEventDiscipline, getIgnoredCategories, transformCategory } from '../utils.ts'
import { formatDurationToSeconds } from '../../manual/utils.ts'

const logger = defaultLogger.child({ provider: PROVIDER_NAME })

export const parseEvent = (
  eventBundle: WebscorerEvent,
  payload: string,
): CleanEventWithResults => {
  const raceSummary = extractRaceSummary(payload)
  const discipline = getEventDiscipline(raceSummary.sport)
  const isTimeTrial = raceSummary.startType === 'Interval start'

  logger.info(`Parsing raw data for ${eventBundle.type} ${eventBundle.hash}: ${eventBundle.name}`)

  const sanctionedEventType = getSanctionedEventType({
    organizerAlias: eventBundle.organizer,
    name: eventBundle.name,
    serie: eventBundle.serie,
    year: eventBundle.year,
  })

  const eventSummary: Omit<EventSummary, 'categories'> = {
    hash: eventBundle.hash,
    date: eventBundle.date!,
    year: eventBundle.year,
    type: 'event',
    discipline,
    location: eventBundle.location,
    organizerAlias: eventBundle.organizer,
    organizerName: eventBundle.organizer,
    name: eventBundle.name,
    isTimeTrial,
    serie: eventBundle.serie,
    sanctionedEventType,
    hasUpgradePoints: hasUpgradePoints(sanctionedEventType),
    isDoubleUpgradePoints: hasDoubleUpgradePoints(sanctionedEventType),
    provider: PROVIDER_NAME,
  }

  let { athletes: allEventAthletes, results: allEventCategories } = extractCategoriesResults(payload, eventBundle)

  // Filter out ignored categories
  const ignoredCategories = getIgnoredCategories(eventSummary)
  allEventCategories = omitBy(allEventCategories, (category: EventCategory) => {
    return ignoredCategories.includes(category.alias)
  })

  // Check if some categories are combined
  const combinedCategoryGroups = getCombinedRaceCategories(eventSummary)

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
  allEventAthletes = mapValues(allEventAthletes, (athlete: CleanEventAthlete) => ({
    ...athlete,
    eventCategories: athlete.eventCategories.filter(catAlias => !!allEventCategories[catAlias] && !allEventCategories[catAlias].combinedCategories),
  }))

  if (eventSummary.hasUpgradePoints) {
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

  return {
    ...eventSummary,
    athletes: allEventAthletes,
    results: allEventCategories,
    sourceUrls: [eventBundle.sourceUrl],
    lastUpdated: eventBundle.lastUpdated!,
  }
}

const extractCategoriesResults = (payload: string, eventSummary: WebscorerEvent) => {
  const $ = cheerio.load(payload)

  const resultPanels = $('#CPH1_upResultsPanel').children('div')

  const allEventCategories: Record<string, EventCategory> = {}
  const allEventAthletes: Record<string, CleanEventAthlete> = {}

  resultPanels.toArray().forEach((panel) => {
    const categoryName = transformCategory($(panel).find('.category-header .categoryTableTitle').text().trim(), eventSummary)
    const categoryAlias = formatCategoryAlias(categoryName)
    const categoryGender = categoryName.includes('Male') ? 'M' : categoryName.includes('Female') ? 'F' : 'X'
    const raceTable = $(panel).find('table.results-table')
    const rows = raceTable.find('tbody tr')
    const athleteRaceResults: CleanAthleteRaceResult[] = []

    rows.toArray().forEach((row) => {
      let position: string | number = -1
      let bibNumber = undefined
      let athleteName = ''
      let teamName = ''
      let ageCategory = null
      let gender = 'X'
      let lapDurations: number[] = []
      let lapGaps: number[] = []
      let lapTimes: Array<number | null> = []
      let finishTime
      let finishGap: null | number = null
      let totalLaps = 0

      $(row).find('td').toArray().forEach((cell, idx) => {
        const cellClassname = $(cell).attr('class') || ''

        if (cellClassname === 'r-place') {
          position = +$(cell).text().trim()
        } else if (cellClassname === 'r-bibnumber') {
          bibNumber = $(cell).text().replace('-', '').trim()
        } else if (cellClassname === 'r-racername') {
          athleteName = $(cell).html()?.replace(/<span[^>]*>[\s\S]*<\/span>/, '').trim().replace('  ', ' ') || ''
          teamName = $(cell).find('.team-name').text().trim()
        } else if (cellClassname === 'r-category') {
          ageCategory = $(cell).text().trim()
        } else if (cellClassname === 'r-gender') {
          gender = $(cell).text().trim().toUpperCase()
        } else if (cellClassname === 'r-laptimes') {
          $(cell).find('.lap-table-wrapper ul.dataRow').each((_, lapRow) => {
            const lapDurationText = $(lapRow).find('.lap-time-rank').first().text().trim()
            const lapDuration = lapDurationText !== '-' && lapDurationText !== '--' ? formatDurationToSeconds(lapDurationText) : 0
            const lapTimeText = $(lapRow).find('.lap-time-rank').next().text().trim()
            const gapText = $(lapRow).find('.lap-race-time-rank').next().text().trim()

            let lapTime = null
            if (lapTimeText !== '-') {
              lapTime = formatDurationToSeconds(lapTimeText)
            }

            let gap = 0
            if (gapText === '-') {
              lapGaps.push(0)
            } else {
              gap = formatDurationToSeconds(gapText)
            }

            lapDurations.push(lapDuration)
            lapTimes.push(lapTime)
            lapGaps.push(gap)
          })
        } else if (cellClassname === 'r-finish-time') {
          const finishTimeText = $(cell).text().trim()
          if (!finishTimeText.includes('lap') && finishTimeText !== '-') {
            finishTime = formatDurationToSeconds(finishTimeText)
          }
        } else if (cellClassname === 'r-difference') {
          const finishGapText = $(cell).find('.sel-D').text().trim()

          if (finishGapText) {
            if (finishGapText === '-') {
              finishGap = 0
            } else {
              finishGap = formatDurationToSeconds(finishGapText)
            }
          }

          totalLaps = +$(cell).find('.sel-L').text().trim()
        }
      })

      let athleteId = bibNumber ? (bibNumber as number).toString() : shortHash(athleteName)

      const [firstName = '', ...lastNames] = athleteName.split(' ')

      let team = TeamParser.parseTeamName(teamName)

      if (allEventAthletes[athleteId]) {
        allEventAthletes[athleteId].eventCategories.push(categoryAlias)
      } else {
        allEventAthletes[athleteId] = {
          bibNumber: bibNumber ? +bibNumber : undefined,
          firstName: capitalize(firstName),
          lastName: lastNames.length ? capitalize(lastNames.join(' ')) : undefined,
          gender: gender as 'M' | 'F' | 'X',
          team: team?.name,
          eventCategories: [categoryAlias],
        }
      }

      let isDNF = false
      if (!finishTime && lapTimes.length > 0) {
        finishTime = Math.max(...lapTimes.filter(time => time !== null) as number[])
        isDNF = true
      }

      const status: 'FINISHER' | 'DNF' | 'DNS' | 'OTL' = isDNF ? 'DNF' : finishTime ? 'FINISHER' : 'DNS'

      athleteRaceResults.push({
        position,
        athleteId,
        bibNumber,
        lapDurations,
        lapGaps,
        status,
        finishTime: finishTime!,
        finishGap,
      })
    })

    const starters = athleteRaceResults.filter(result => result.status !== 'DNS').length
    const finishers = athleteRaceResults.filter(result => result.status === 'FINISHER').length

    allEventCategories[categoryAlias] = {
      alias: categoryAlias,
      label: categoryName,
      gender: categoryGender,

      starters,
      finishers,
      distanceUnit: 'km',

      results: athleteRaceResults,
    } as EventCategory
  })

  return {
    athletes: allEventAthletes,
    results: allEventCategories,
  }
}

const extractRaceSummary = (payload: string) => {
  const $ = cheerio.load(payload)

  const sport = $('.race-info-summary-wrapper table td:contains(Sport)').next().text().trim()
  const startType = $('.race-info-summary-wrapper table td:contains(Start type)').next().text().trim()

  return { sport, startType }
}