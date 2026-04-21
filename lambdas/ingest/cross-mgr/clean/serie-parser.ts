import * as cheerio from 'cheerio'
import { formatCategoryAlias, transformCategoryLabel } from 'shared/categories'
import { formatSerieName, transformOrganizerAlias, transformSerieAlias } from 'shared/events'
import defaultLogger from 'shared/logger.ts'
import { TeamParser } from 'shared/team-parser'
import type {
  ParticipantSerieEventResult,
  SerieIndividualEvent,
  SerieStandings,
  SerieTeamEvent,
  TeamSerieEventResult,
  UpdateSerie
} from 'shared/types.ts'
import { capitalize, } from 'shared/utils'
import shortHash from 'short-hash'
import { BaseCategory } from '../../../../shared/types'
import { PROVIDER_NAME, SOURCE_URL_PREFIX } from '../config.ts'
import type { CrossMgrEventBundle, CrossMgrSerieRawData } from '../types.ts'

const logger = defaultLogger.child({ provider: PROVIDER_NAME })

type ParticipantSerieCombinedResult = Partial<Omit<ParticipantSerieEventResult, 'points'>> & {
  racePoints: Record<string, number>
  totalPoints: number
}

type TeamSerieCombinedResult = Partial<Omit<TeamSerieEventResult, 'points'>> & {
  racePoints: Record<string, number>
  totalPoints: number
}

export const parseRawSerie = async (
  serieBundle: CrossMgrEventBundle,
  payloads: CrossMgrSerieRawData['payloads'],
): Promise<{ serie: UpdateSerie, serieStandings: SerieStandings }> => {
  const alias = await transformSerieAlias({
    alias: serieBundle.serie!,
    organizerAlias: serieBundle.organizer,
    year: serieBundle.year
  })
  const serieName = formatSerieName({ alias: alias!, organizerAlias: serieBundle.organizer, year: serieBundle.year })

  logger.info(`Parsing raw data for ${serieBundle.type} ${serieBundle.hash}: ${serieName}`)

  const serie: UpdateSerie = {
    hash: serieBundle.hash,
    year: serieBundle.year,
    organizerAlias: await transformOrganizerAlias(serieBundle.organizer, {
      organizerName: serieName,
      year: serieBundle.year
    }),
    alias: alias!,
    name: serieName,
    types: [],
    // Metadata
    provider: PROVIDER_NAME,
    updatedAt: serieBundle.lastUpdated,
  }

  let individualStandings: SerieStandings['individual']
  let teamStandings: SerieStandings['team']

  let individualCategories: BaseCategory[] = []
  let teamCategories: BaseCategory[] = []

  for (const filename of Object.keys(payloads)) {
    const payload = payloads[filename]
    const resultType = getSeriesResultType(payload)

    if (resultType === 'INDIVIDUAL') {
      ;({
        standings: individualStandings,
        categories: individualCategories
      } = await parseSerieIndividualResults(payload, filename, serie))
    } else {
      if (payload.includes('<div id="catContent0">')) {
        ;({
          standings: teamStandings,
          categories: teamCategories
        } = await parseSerieTeamResults(payload, filename, serie))
      } else {
        ;({
          standings: teamStandings,
          categories: teamCategories
        } = await parseSerieTeamResultsFromOrangeTable(payload, filename, serie))
      }
    }
  }

  const allCategories = individualCategories

  // If there are team categories that are not present in individual categories, we add them to the list of categories for the serie
  teamCategories.forEach(teamCategory => {
    if (!allCategories.some(individualCategory => individualCategory.alias === teamCategory.alias)) {
      logger.warn(`Category ${teamCategory.alias} is present in team standings but not in individual standings for serie ${serie.alias}.`, { hash: serie.hash })
      allCategories.push(teamCategory)
    }
  })

  if (individualStandings?.events.length && allCategories.length) serie.types.push('individual')
  if (teamStandings?.events.length) serie.types.push('team')

  return {
    serie,
    serieStandings: {
      hash: serie.hash!,
      categories: allCategories,
      individual: individualStandings,
      team: teamStandings,
    }
  }
}

const getSeriesResultType = (content: string): 'INDIVIDUAL' | 'TEAM' => {
  if (content.match(/<th (.+)sortTableId(.+)><span(.+)><\/span>\n?License<\/th>/m)) return 'INDIVIDUAL'
  else return 'TEAM'
}

const parseSerieIndividualResults = async (
  fileContent: string,
  sourceFile: string,
  serieSummary: UpdateSerie,
): Promise<{ standings: SerieStandings['individual'], categories: BaseCategory[] }> => {
  logger.info('Parsing individual results from ' + sourceFile)

  const $ = cheerio.load(fileContent)

  const categories: BaseCategory[] = []
  const standingsByDates: Record<string, SerieIndividualEvent> = {}

  const resultsTables = $('table.results')

  if (!resultsTables.length) throw new Error('No results tables found for ' + sourceFile)

  for (const resultTable of resultsTables.toArray()) {
    const categoryName = $('h2', resultTable.parentNode).text().trim()

    const columns: { type: string | null, date?: string }[] = []

    $('thead tr:first-of-type th', resultTable).each((_, th) => {
      if ($(th).hasClass('centerAlign')) {
        const textDate = $('.smallFont', th).first().text()
        const parsedDate = new Date(textDate)
        const eventDate = parsedDate.toISOString().slice(0, 10)
        columns.push({ type: 'racePoints', date: eventDate })

        if ($(th).attr('colspan')) columns.push({ type: null })
      } else {
        const label = $(th).text().trim()
        if (label === 'Pos') columns.push({ type: 'position' })
        else if (label.includes('Name')) columns.push({ type: 'fullName' })
        else if (label.includes('License')) columns.push({ type: 'license' })
        else if (label.includes('UCI')) columns.push({ type: 'uciId' })
        else if (label.includes('Team')) columns.push({ type: 'team' })
        else if (label.includes('Points')) columns.push({ type: 'totalPoints' })
        else if (label.includes('Gap')) columns.push({ type: 'gap' })
        else {
          logger.warn('Unknown column type: ' + label, { hash: serieSummary.hash, sourceFile })
          columns.push({ type: null })
        }
      }
    })

    const categoryGender = categoryName.includes('Men') ? 'M' : categoryName.includes('Women') ? 'F' : 'X'
    const categoryLabel = await transformCategoryLabel(categoryName, {
      eventName: serieSummary.name,
      organizerAlias: serieSummary.organizerAlias,
      year: serieSummary.year!
    })
    const categoryAlias = formatCategoryAlias(categoryName)

    const combinedIndividualResults: ParticipantSerieCombinedResult[] = []
    const eventDates = new Set<string>()

    $('tbody tr', resultTable).each((_, tr) => {
      const participantResult: ParticipantSerieCombinedResult = {
        racePoints: {},
        totalPoints: 0,
      }

      $('td', tr).each((index, td) => {
        const eventDate = columns[index].date!
        const col = columns[index]

        if (col.type === 'racePoints' && eventDate) {
          eventDates.add(eventDate)
        }

        switch (col.type) {
          // case 'position':
          case 'totalPoints':
            participantResult.totalPoints = +$(td).text().trim()
            break
          case 'fullName': {
            const [lastName, firstName] = $(td).text().split(',')
            participantResult.lastName = capitalize(lastName.trim())
            participantResult.firstName = capitalize(firstName.trim())
            participantResult.participantId = shortHash(`${participantResult.firstName} ${participantResult.lastName}`)
            break
          }
          case 'team': {
            const team = TeamParser.parseTeamName($(td).text().trim())

            participantResult.team = team?.name
            break
          }
          case 'uciId':
            participantResult.uciId = $(td).text().replace(/\s/g, '').trim()
            break
          case 'racePoints': {
            participantResult.racePoints[eventDate] = +$(td).text().trim()
            break
          }
        }
      })

      if (participantResult.uciId) {
        // If athlete has an override for the current year team, use that instead
        const teamOverride = TeamParser.getManualTeamForAthlete(participantResult.uciId, serieSummary.year)
        if (teamOverride) participantResult.team = teamOverride.name
      }

      combinedIndividualResults.push(participantResult)
    })

    combinedIndividualResults.forEach(result => {
      Object.entries(result.racePoints).forEach(([eventDate, points]) => {
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
          participantId: result.participantId!,
          uciId: result.uciId,
          firstName: result.firstName!,
          lastName: result.lastName!,
          team: result.team,
          points,
        })
      })
    })

    categories.push({ alias: categoryAlias, label: categoryLabel, gender: categoryGender })
  }

  return {
    standings: {
      events: Object.values(standingsByDates),
      sourceUrls: [SOURCE_URL_PREFIX + sourceFile],
    },
    categories,
  }
}

// Classic green table
async function parseSerieTeamResults(
  fileContent: string,
  sourceFile: string,
  serieSummary: UpdateSerie,
): Promise<{ standings: SerieStandings['team'], categories: BaseCategory[] }> {
  logger.info('Parsing team results from ' + sourceFile)

  const $ = cheerio.load(fileContent)

  const categories: BaseCategory[] = []
  const standingsByDates: Record<string, SerieTeamEvent> = {}

  const resultsTables = $('table.results')

  if (!resultsTables.length) throw new Error('No results tables found for ' + sourceFile)

  for (const resultTable of resultsTables.toArray()) {
    const categoryName = $('h2', resultTable.parentNode).text().trim()

    const columns: { type: string | null, date?: string }[] = []

    $('thead tr:first-of-type th', resultTable).each((_, th) => {
      if ($(th).hasClass('centerAlign')) {
        const textDate = $('.smallFont', th).first().text()
        const parsedDate = new Date(textDate)
        const eventDate = parsedDate.toISOString().slice(0, 10)
        columns.push({ type: 'racePoints', date: eventDate })

        if ($(th).attr('colspan')) columns.push({ type: null })
      } else {
        const label = $(th).text().trim()
        if (label === 'Pos') columns.push({ type: 'position' })
        else if (label.includes('Team')) columns.push({ type: 'team' })
        else if (label.includes('Points')) columns.push({ type: 'totalPoints' })
        else if (label.includes('Gap')) columns.push({ type: 'gap' })
        else {
          logger.warn('Unknown column type: ' + label, { hash: serieSummary.hash, sourceFile })
          columns.push({ type: null })
        }
      }
    })

    const categoryGender = categoryName.includes('Men') ? 'M' : categoryName.includes('Women') ? 'F' : 'X'
    const categoryLabel = await transformCategoryLabel(categoryName, {
      eventName: serieSummary.name,
      organizerAlias: serieSummary.organizerAlias,
      year: serieSummary.year!
    })
    const categoryAlias = formatCategoryAlias(categoryName)

    const combinedTeamResults: TeamSerieCombinedResult[] = []
    const eventDates = new Set<string>()

    $('tbody tr', resultTable).each((_, tr) => {
      const teamResult: TeamSerieCombinedResult = {
        racePoints: {},
        totalPoints: 0,
      }

      $('td', tr).each((index, td) => {
        const eventDate = columns[index].date!
        const col = columns[index]

        if (col.type === 'racePoints' && eventDate) {
          eventDates.add(eventDate)
        }

        switch (col.type) {
          case 'totalPoints':
            teamResult.totalPoints = +$(td).text().trim()
            break
          case 'team':
            const team = TeamParser.parseTeamName($(td).text().trim())

            teamResult.team = team?.name || 'Independent'
            break
          case 'racePoints': {
            teamResult.racePoints[eventDate] = +$(td).text().replace(/\([0-9]+[a-z]{1,2}\)/, '').trim()
            break
          }
        }
      })

      combinedTeamResults.push(teamResult)
    })

    combinedTeamResults.forEach(result => {
      Object.entries(result.racePoints).forEach(([eventDate, points]) => {
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
          team: result.team!,
          points,
        })
      })
    })

    categories.push({
      alias: categoryAlias,
      label: categoryLabel,
      gender: categoryGender,
    })
  }

  return {
    standings: {
      events: Object.values(standingsByDates),
      sourceUrls: [SOURCE_URL_PREFIX + sourceFile],
    },
    categories,
  }
}

// Orange table
const parseSerieTeamResultsFromOrangeTable = async (
  fileContent: string,
  sourceFile: string,
  serieSummary: UpdateSerie,
): Promise<{ standings: SerieStandings['team'], categories: BaseCategory[] }> => {
  const $ = cheerio.load(fileContent)

  logger.info('Parsing team results from ' + sourceFile)
  const categories: BaseCategory[] = []
  const combinedTeamStandings: SerieTeamEvent = {
    date: null, // Orange tables don't have event dates, so we'll leave this empty
    categories: {},
    published: true,
    combinedPoints: true, // This indicates that the points are already combined for the entire series, not per event
  }

  const categoryRows = $('table.dataframe tbody tr.category-row')
  if (!categoryRows.length) throw new Error('No category rows found: ' + sourceFile)

  for (const categoryRow of categoryRows.toArray()) {
    const categoryName = $('th.th-category-left', categoryRow).text().trim()
    const formattedCategoryName = categoryName.replace(/\s/g, '_')
    const resultRow = $(`table.dataframe tbody tr.hidden-category-row[data_category="data_category-${formattedCategoryName}"]`)

    if (!resultRow.length) throw new Error('No result row found for category: ' + categoryName)

    const teamResults: TeamSerieEventResult[] = []

    $('table tbody tr.team-row', resultRow).each((_, teamRow) => {
      const teamResult: Partial<TeamSerieEventResult> = {}

      $('td', teamRow).each((index, cell) => {
        if (index === 0) {
          // const position = +$(cell).text().trim()
          // if (position !== 0) {
          //   teamResult.position = position
          // } else {
          //   teamResult.position = -1
          // }
        } else if (index === 1) {
          const team = TeamParser.parseTeamName($(cell).text().trim())

          teamResult.team = team?.name || 'Independent'
        } else if (index === 2) teamResult.points = +$(cell).text().trim()
      })

      teamResults.push(teamResult as TeamSerieEventResult)
    })

    const categoryGender = categoryName.includes('Men') ? 'M' : categoryName.includes('Women') ? 'F' : 'X'
    const categoryLabel = await transformCategoryLabel(categoryName, {
      eventName: serieSummary.name,
      organizerAlias: serieSummary.organizerAlias,
      year: serieSummary.year!
    })
    const categoryAlias = formatCategoryAlias(categoryName)

    combinedTeamStandings.categories[categoryAlias] = {
      standings: teamResults,
      updatedAt: serieSummary.updatedAt,
    }

    categories.push({
      alias: categoryAlias,
      label: categoryLabel,
      gender: categoryGender,
      updatedAt: serieSummary.updatedAt,
    })
  }

  return {
    standings: {
      events: [combinedTeamStandings],
      sourceUrls: [SOURCE_URL_PREFIX + sourceFile],
    },
    categories: categories,
  }
}