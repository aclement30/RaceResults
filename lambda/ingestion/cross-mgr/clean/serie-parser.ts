import type {
  CrossMgrEventBundle,
  CrossMgrSerieRawData
} from '../types.ts'
import {
  formatSerieName,
  transformCategory,
  transformOrganizerAlias,
  transformSerieAlias
} from '../utils.ts'
import type {
  AthleteSerieResult,
  SerieIndividualCategory,
  SerieResults,
  SerieSummary, SerieTeamCategory, TeamSerieResult
} from '../../../../src/types/results.ts'
import { capitalize, formatCategoryAlias } from '../../shared/utils.ts'
import * as cheerio from 'cheerio'
import defaultLogger from '../../shared/logger.ts'
import { PROVIDER_NAME, SOURCE_URL_PREFIX } from '../config.ts'
import type { CleanSerieWithResults } from '../../shared/types.ts'
import { TeamParser } from '../../shared/team-parser.ts'

const logger = defaultLogger.child({ provider: PROVIDER_NAME })

export const parseSerie = (
  serieBundle: CrossMgrEventBundle,
  payloads: CrossMgrSerieRawData['payloads'],
): CleanSerieWithResults => {
  const alias = transformSerieAlias(serieBundle.serie, serieBundle.organizer)!
  const serieName = formatSerieName(alias)

  logger.info(`Parsing raw data for ${serieBundle.type} ${serieBundle.hash}: ${serieName}`)

  const serieSummary: Omit<SerieSummary, 'categories'> = {
    hash: serieBundle.hash,
    year: serieBundle.year,
    type: 'serie',
    organizerAlias: transformOrganizerAlias(serieBundle.organizer),
    alias,
    name: serieName,
    provider: PROVIDER_NAME,
  }

  let individualResults: SerieResults['individual']
  let teamResults: SerieResults['team']

  Object.keys(payloads).forEach((filename) => {
    const payload = payloads[filename]
    const resultType = getSeriesResultType(payload)

    if (resultType === 'INDIVIDUAL') {
      individualResults = parseSerieIndividualResults(payload, filename, serieSummary)!
    } else {
      if (payload.includes('<div id="catContent0">')) {
        teamResults = parseSerieTeamResults(payload, filename, serieSummary)!
      } else {
        teamResults = parseSerieTeamResultsFromOrangeTable(payload, filename, serieSummary)!
      }
    }
  })

  return {
    ...serieSummary,
    individual: individualResults,
    team: teamResults,
    lastUpdated: serieBundle.lastUpdated,
  }
}

const getSeriesResultType = (content: string): 'INDIVIDUAL' | 'TEAM' => {
  if (content.match(/<th (.+)sortTableId(.+)><span(.+)><\/span>\n?License<\/th>/m)) return 'INDIVIDUAL'
  else return 'TEAM'
}

const parseSerieIndividualResults = (
  fileContent: string,
  sourceFile: string,
  serieSummary: Pick<SerieSummary, 'hash' | 'name' | 'year' | 'organizerAlias'>,
): SerieResults['individual'] => {
  logger.info('Parsing team results from ' + sourceFile)

  const $ = cheerio.load(fileContent)

  const combinedSeriesCategories: Record<string, SerieIndividualCategory> = {}

  const resultsTables = $('table.results')

  if (!resultsTables.length) throw new Error('No results tables found for ' + sourceFile)

  resultsTables.each((i, resultTable) => {
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

    const individualResults: AthleteSerieResult[] = []

    $('tbody tr', resultTable).each((_, tr) => {
      const athleteResult: Record<string, any> = {
        racePoints: {}
      }

      $('td', tr).each((index, td) => {
        switch (columns[index].type) {
          case 'position':
          case 'totalPoints':
            athleteResult[columns[index].type] = +$(td).text().trim()
            break
          case 'fullName': {
            const [lastName, firstName] = $(td).text().split(',')
            athleteResult.lastName = capitalize(lastName.trim())
            athleteResult.firstName = capitalize(firstName.trim())
            break
          }
          case 'license':
            athleteResult[columns[index].type] = $(td).text().trim()
            break
          case 'team':
            const team = TeamParser.parseTeamName($(td).text().trim())

            athleteResult[columns[index].type] = team?.name
            break
          case 'uciId':
            athleteResult[columns[index].type] = $(td).text().replace(/\s/g, '').trim()
            break
          case 'racePoints': {
            athleteResult.racePoints[columns[index].date!] = +$(td).text().trim()
            break
          }
        }
      })

      individualResults.push(athleteResult as AthleteSerieResult)
    })

    const categoryGender = categoryName.includes('Men') ? 'M' : categoryName.includes('Women') ? 'F' : 'X'
    const categoryLabel = transformCategory(categoryName, serieSummary)
    const alias = formatCategoryAlias(categoryLabel)

    combinedSeriesCategories[alias] = {
      alias,
      label: categoryLabel,
      gender: categoryGender,
      results: individualResults,
    }
  })

  return {
    results: combinedSeriesCategories,
    sourceUrls: [SOURCE_URL_PREFIX + sourceFile],
  }
}

// Classic green table
function parseSerieTeamResults(
  fileContent: string,
  sourceFile: string,
  serieSummary: Pick<SerieSummary, 'hash' | 'name' | 'year' | 'organizerAlias'>,
): SerieResults['team'] {
  logger.info('Parsing team results from ' + sourceFile)

  const $ = cheerio.load(fileContent)

  const combinedSeriesCategories: Record<string, SerieTeamCategory> = {}

  const resultsTables = $('table.results')

  if (!resultsTables.length) throw new Error('No results tables found for ' + sourceFile)

  resultsTables.each((i, resultTable) => {
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

    const teamResults: TeamSerieResult[] = []

    $('tbody tr', resultTable).each((_, tr) => {
      const teamResult: Record<string, any> = {
        racePoints: {}
      }

      $('td', tr).each((index, td) => {
        switch (columns[index].type) {
          case 'position':
          case 'totalPoints':
            teamResult[columns[index].type] = +$(td).text().trim()
            break
          case 'team':
            const team = TeamParser.parseTeamName($(td).text().trim())

            teamResult[columns[index].type] = team?.name
            break
          case 'racePoints': {
            teamResult.racePoints[columns[index].date!] = +$(td).text().replace(/\([0-9]+[a-z]{1,2}\)/, '').trim()
            break
          }
        }
      })

      teamResults.push(teamResult as TeamSerieResult)
    })

    const categoryGender = categoryName.includes('Men') ? 'M' : categoryName.includes('Women') ? 'F' : 'X'
    const categoryLabel = transformCategory(categoryName, serieSummary)
    const alias = formatCategoryAlias(categoryLabel)

    combinedSeriesCategories[alias] = {
      alias,
      label: categoryLabel,
      gender: categoryGender,
      results: teamResults,
    }
  })

  return {
    results: combinedSeriesCategories,
    sourceUrls: [SOURCE_URL_PREFIX + sourceFile],
  }
}

// Orange table
const parseSerieTeamResultsFromOrangeTable = (
  fileContent: string,
  sourceFile: string,
  serieSummary: Pick<SerieSummary, 'name' | 'year' | 'organizerAlias'>,
): SerieResults['team'] => {
  const $ = cheerio.load(fileContent)

  logger.info('Parsing team results from ' + sourceFile)
  const combinedSeriesCategories: Record<string, SerieTeamCategory> = {}

  const categoryRows = $('table.dataframe tbody tr.category-row')
  if (!categoryRows.length) throw new Error('No category rows found: ' + sourceFile)

  categoryRows.each((_, categoryRow) => {
    const categoryName = $('th.th-category-left', categoryRow).text().trim()
    const formattedCategoryName = categoryName.replace(/\s/g, '_')
    const resultRow = $(`table.dataframe tbody tr.hidden-category-row[data_category="data_category-${formattedCategoryName}"]`)

    if (!resultRow.length) throw new Error('No result row found for category: ' + categoryName)

    const teamResults: TeamSerieResult[] = []

    $('table tbody tr.team-row', resultRow).each((_, teamRow) => {
      const teamResult: Record<string, any> = {}

      $('td', teamRow).each((index, cell) => {
        if (index === 0) {
          const position = +$(cell).text().trim()
          if (position !== 0) {
            teamResult.position = position
          } else {
            teamResult.position = -1
          }
        } else if (index === 1) {
          const team = TeamParser.parseTeamName($(cell).text().trim())

          teamResult.team = team?.name
        } else if (index === 2) teamResult.totalPoints = +$(cell).text().trim()
      })

      teamResults.push(teamResult as TeamSerieResult)
    })

    const categoryGender = categoryName.includes('Men') ? 'M' : categoryName.includes('Women') ? 'F' : 'X'
    const categoryLabel = transformCategory(categoryName, serieSummary)
    const alias = formatCategoryAlias(categoryLabel)

    combinedSeriesCategories[alias] = {
      alias,
      label: categoryLabel,
      gender: categoryGender,
      results: teamResults,
    }
  })

  return {
    results: combinedSeriesCategories,
    sourceUrls: [SOURCE_URL_PREFIX + sourceFile],
  }
}