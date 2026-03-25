import * as cheerio from 'cheerio'
import {
  createUmbrellaCategories,
  formatCategoryAlias,
  getCombinedRaceCategories,
  getIgnoredCategories,
  transformCategoryLabel
} from 'shared/categories'
import { getEventDiscipline, getRaceType, getSanctionedEventType } from 'shared/events'
import defaultLogger from 'shared/logger.ts'
import { TeamParser } from 'shared/team-parser'
import type {
  CreateEventCategory,
  CreateEventResults,
  ParticipantResult,
  TParticipantStatus,
  UpdateEvent
} from 'shared/types.ts'
import { calculateBCUpgradePoints, calculateFieldSize, hasUpgradePoints } from 'shared/upgrade-points'
import { capitalize } from 'shared/utils'
import shortHash from 'short-hash'
import { formatDurationToSeconds } from '../../manual/utils.ts'
import { PROVIDER_NAME } from '../config.ts'
import type { WebscorerEvent } from '../types.ts'

const logger = defaultLogger.child({ provider: PROVIDER_NAME })

export const parseRawEvent = async (
  eventBundle: WebscorerEvent,
  payload: string,
): Promise<{ event: UpdateEvent, eventResults: CreateEventResults }> => {
  const raceSummary = extractRaceSummary(payload)
  const discipline = await getEventDiscipline({ sport: raceSummary.sport })
  const isTimeTrial = raceSummary.startType === 'Interval start'

  logger.info(`Parsing raw data for ${eventBundle.type} ${eventBundle.hash}: ${eventBundle.name}`)

  const sanctionedEventType = await getSanctionedEventType({
    eventName: eventBundle.name,
    organizerAlias: eventBundle.organizer,
    year: eventBundle.year,
    serieAlias: eventBundle.serie,
  })

  const event: UpdateEvent = {
    hash: eventBundle.hash,
    date: eventBundle.date!,
    discipline,
    location: eventBundle.location,
    organizerAlias: eventBundle.organizer,
    name: eventBundle.name,
    serie: eventBundle.serie || null,
    sanctionedEventType,
    raceType: null,
    sourceUrls: [eventBundle.sourceUrl],
    // Metadata
    provider: PROVIDER_NAME,
    updatedAt: eventBundle.lastUpdated,
    published: false,
  }

  event.raceType = await getRaceType({ ...event, isTimeTrial })

  let allEventCategories = await extractCategoriesResults(payload, eventBundle)

  // Filter out ignored categories
  const ignoredCategories = await getIgnoredCategories({ serieAlias: event.serie })
  allEventCategories = allEventCategories.filter((category) => !ignoredCategories.includes(category.alias))

  // Check if some categories are combined
  const combinedCategoryGroups = await getCombinedRaceCategories({
    eventHash: event.hash,
    serieAlias: event.serie,
    organizerAlias: event.organizerAlias,
    eventName: event.name,
    year: eventBundle.year,
  })

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

      if (eventBundle.hash === 'ff663175' && upgradePoints.some(p => !p.position)) console.log({
        results: category.results,
        upgradePoints
      })

      return {
        ...category,
        fieldSize,
        upgradePoints,
      }
    })
  }

  if (Object.keys(allEventCategories).length) event.published = true


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

const extractCategoriesResults = async (
  payload: string,
  eventSummary: WebscorerEvent
): Promise<CreateEventCategory[]> => {
  const $ = cheerio.load(payload)

  const resultPanels = $('#CPH1_upResultsPanel').children('div')

  const allEventCategories: CreateEventCategory[] = []

  for (const panel of resultPanels.toArray()) {
    const categoryName = await transformCategoryLabel($(panel).find('.category-header .categoryTableTitle').text().trim(), { serieAlias: eventSummary.serie })
    const categoryAlias = formatCategoryAlias(categoryName)
    const categoryGender = categoryName.includes('Male') ? 'M' : categoryName.includes('Female') ? 'F' : 'X'
    const raceTable = $(panel).find('table.results-table')
    const rows = raceTable.find('tbody tr')
    const participantResults: ParticipantResult[] = []

    rows.toArray().forEach((row) => {
      let position: string | number = -1
      let bibNumber = undefined
      let athleteName = ''
      let teamName = ''
      let ageCategory = null
      let gender = undefined
      let lapDurations: number[] = []
      let lapGaps: number[] = []
      let lapTimes: Array<number | null> = []
      let finishTime
      let finishGap: null | number = null
      let totalLaps = 0

      $(row).find('td').toArray().forEach((cell, idx) => {
        const cellClassname = $(cell).attr('class') || ''

        if (cellClassname === 'r-place') {
          const rawPosition = $(cell).text().trim()
          if (rawPosition === '-' || isNaN(+rawPosition)) {
            position = -1
          } else {
            position = +rawPosition
          }
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
          if (!finishTimeText.includes('lap') && finishTimeText !== '-' && !/^[A-Z]{2,3}$/.test(finishTimeText)) {
            finishTime = formatDurationToSeconds(finishTimeText)
          }
        } else if (cellClassname === 'r-difference') {
          const finishGapText = $(cell).find('.sel-D').text().trim()

          try {
            if (finishGapText) {
              if (finishGapText === '-') {
                finishGap = 0
              } else {
                finishGap = formatDurationToSeconds(finishGapText)
              }
            }
          } catch (e) {
            logger.error(`Error parsing finish gap for athlete ${athleteName} in category ${categoryAlias}: ${(e as any).message}`, {
              provider: PROVIDER_NAME,
              eventHash: eventSummary.hash,
              categoryAlias,
              athleteName,
              finishGapText,
            })
          }

          totalLaps = +$(cell).find('.sel-L').text().trim()
        }
      })

      let participantId = bibNumber ? (bibNumber as number).toString() : shortHash(athleteName)

      const [firstName = '', ...lastNames] = athleteName.split(' ')

      let team = TeamParser.parseTeamName(teamName)

      let isDNF = false
      if (!finishTime && lapTimes.length > 0) {
        const nonNullLapTimes = lapTimes.filter(time => time !== null)
        if (nonNullLapTimes.length) finishTime = Math.max(...nonNullLapTimes)
        isDNF = true
      }

      const status: TParticipantStatus = isDNF ? 'DNF' : finishTime ? 'FINISHER' : 'DNS'

      // Fix a weird bug in older events
      if ((!position || position < 0) && status === 'FINISHER' && finishTime && rows.length === 1) position = 1

      participantResults.push({
        participantId,
        bibNumber: bibNumber ? +bibNumber : undefined,
        // Demographic data
        firstName: capitalize(firstName),
        lastName: lastNames.length ? capitalize(lastNames.join(' ')) : undefined,
        gender: gender && (gender as string).length ? gender as 'M' | 'F' | 'X' : undefined,
        team: team?.name,
        // Finish position
        position: position > 0 ? position : null,
        status,
        // Timing data
        lapDurations,
        lapGaps,
        finishTime: finishTime || null,
        finishGap: finishGap || undefined,
      })
    })

    // if (totalLaps > 0) participantResults = calculateLapGaps(participantResults, totalLaps)

    const starters = participantResults.filter(result => result.status !== 'DNS').length
    const finishers = participantResults.filter(result => result.status === 'FINISHER').length

    allEventCategories.push({
      alias: categoryAlias,
      label: categoryName,
      gender: categoryGender,

      starters,
      finishers,

      results: participantResults,

      primes: [],
      upgradePoints: null, // Will be calculated later if applicable
    })
  }

  return allEventCategories
}

const extractRaceSummary = (payload: string) => {
  const $ = cheerio.load(payload)

  const sport = $('.race-info-summary-wrapper table td:contains(Sport)').next().text().trim()
  const startType = $('.race-info-summary-wrapper table td:contains(Start type)').next().text().trim()

  return { sport, startType }
}