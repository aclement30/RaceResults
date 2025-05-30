import * as cheerio from 'cheerio'
import { fetchFile } from './aws-s3.ts'
import defaultLogger from '../shared/logger.ts'
import { SOURCE_URL_PREFIX } from './race-results.ts'
import type {
  AthleteSerieResult,
  SerieIndividualCategory,
  SerieResults,
  SerieSummary,
  SerieTeamCategory, TeamSerieResult
} from '../../../src/types/results.ts'
import { formatCategoryAlias, getBaseCategories } from '../shared/utils.ts'
import {
  formatSerieName,
  transformCategory,
  transformOrganizerAlias,
  transformSerieAlias
} from './utils.ts'
import type { CrossMgrEventFile } from './types.ts'

const logger = defaultLogger.child({ provider: 'cross-mgr' })

export async function getFullSeriesWithResults(crossMgrSerie: Omit<CrossMgrEventFile, 'files'>, sourceFiles: string[]) {
  const fileContents = await Promise.all(sourceFiles.map(async (filename: string) => fetchFile(filename)))
  const alias = transformSerieAlias(crossMgrSerie.series, crossMgrSerie.organizer)!

  const serieSummary: SerieSummary = {
    hash: crossMgrSerie.hash,
    year: crossMgrSerie.year,
    organizerAlias: transformOrganizerAlias(crossMgrSerie.organizer),
    alias,
    name: formatSerieName(alias),
    provider: 'cross-mgr',
    categories: {},
  }

  const seriesResults: SerieResults = {
    hash: serieSummary.hash,
    lastUpdated: crossMgrSerie.lastUpdated,
  }

  fileContents.forEach((fileContent, i) => {
    if (!fileContent) throw new Error(`File ${sourceFiles[i]} not found`)

    const resultType = getSeriesResultType(fileContent)

    if (resultType === 'INDIVIDUAL') {
      const individualResults = parseSerieIndividualResults(fileContent, sourceFiles[i], serieSummary)!
      seriesResults.individual = individualResults
      serieSummary.categories.individual = getBaseCategories(individualResults.results)
    } else {
      let teamResults
      if (fileContent.includes('<div id="catContent0">')) {
        teamResults = parseSerieTeamResults(fileContent, sourceFiles[i], serieSummary)!
      } else {
        teamResults = parseSerieTeamResultsFromOrangeTable(fileContent, sourceFiles[i], serieSummary)!
      }

      seriesResults.team = teamResults
      serieSummary.categories.team = getBaseCategories(teamResults.results)
    }
  })

  return {
    summary: serieSummary,
    results: seriesResults,
    type: 'series',
  }
}

function getSeriesResultType(content: string): 'INDIVIDUAL' | 'TEAM' {
  if (content.match(/<th (.+)sortTableId(.+)><span(.+)><\/span>\n?License<\/th>/m)) return 'INDIVIDUAL'
  else return 'TEAM'
}

function parseSerieIndividualResults(fileContent: string, sourceFile: string, serieSummary: SerieSummary): SerieResults['individual'] {
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
          logger.warn('Unknown column type: ' + label)
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
          case 'fullName':
            const [lastName, firstName] = $(td).text().split(',')
            athleteResult.lastName = lastName.trim()
            athleteResult.firstName = firstName.trim()
            break
          case 'license':
          case 'uciId':
          case 'team':
            athleteResult[columns[index].type] = $(td).text().trim()
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
function parseSerieTeamResults(fileContent: string, sourceFile: string, serieSummary: SerieSummary): SerieResults['team'] {
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
          logger.warn('Unknown column type: ' + label)
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
            teamResult[columns[index].type] = $(td).text().trim()
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
function parseSerieTeamResultsFromOrangeTable(fileContent: string, sourceFile: string, serieSummary: SerieSummary): SerieResults['team'] {
  logger.info('Parsing team results from ' + sourceFile)

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
        } else if (index === 1) teamResult.team = $(cell).text().trim()
        else if (index === 2) teamResult.totalPoints = +$(cell).text().trim()
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