import * as cheerio from 'cheerio'
import { formatCategoryAlias, transformCategoryLabel } from 'shared/categories'
import { formatSerieName, transformOrganizerAlias, transformSerieAlias } from 'shared/events'
import defaultLogger from 'shared/logger.ts'
import { TeamParser } from 'shared/team-parser'
import type {
  CreateSerieIndividualCategory,
  CreateSerieResults,
  CreateSerieTeamCategory,
  ParticipantSerieResult,
  TeamSerieResult,
  UpdateSerie
} from 'shared/types.ts'
import { capitalize, } from 'shared/utils'
import shortHash from 'short-hash'
import { PROVIDER_NAME, SOURCE_URL_PREFIX } from '../config.ts'
import type { CrossMgrEventBundle, CrossMgrSerieRawData } from '../types.ts'

const logger = defaultLogger.child({ provider: PROVIDER_NAME })

export const parseRawSerie = async (
  serieBundle: CrossMgrEventBundle,
  payloads: CrossMgrSerieRawData['payloads'],
): Promise<{ serie: UpdateSerie, serieResults: CreateSerieResults }> => {
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
    published: true,
  }

  let individualResults: CreateSerieResults['individual']
  let teamResults: CreateSerieResults['team']

  for (const filename of Object.keys(payloads)) {
    const payload = payloads[filename]
    const resultType = getSeriesResultType(payload)

    if (resultType === 'INDIVIDUAL') {
      individualResults = await parseSerieIndividualResults(payload, filename, serie)
    } else {
      if (payload.includes('<div id="catContent0">')) {
        teamResults = await parseSerieTeamResults(payload, filename, serie)
      } else {
        teamResults = await parseSerieTeamResultsFromOrangeTable(payload, filename, serie)
      }
    }
  }

  if (individualResults?.categories.length) serie.types.push('individual')
  if (teamResults?.categories.length) serie.types.push('team')

  return {
    serie,
    serieResults: {
      hash: serie.hash!,
      individual: individualResults,
      team: teamResults,
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
): Promise<CreateSerieResults['individual']> => {
  logger.info('Parsing team results from ' + sourceFile)

  const $ = cheerio.load(fileContent)

  const combinedSeriesCategories: CreateSerieIndividualCategory[] = []

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

    const individualResults: ParticipantSerieResult[] = []

    $('tbody tr', resultTable).each((_, tr) => {
      const participantResult: Partial<ParticipantSerieResult> & { racePoints: Record<string, number> } = {
        racePoints: {}
      }

      $('td', tr).each((index, td) => {
        switch (columns[index].type) {
          case 'position':
          case 'totalPoints':
            participantResult[columns[index].type] = +$(td).text().trim()
            break
          case 'fullName': {
            const [lastName, firstName] = $(td).text().split(',')
            participantResult.lastName = capitalize(lastName.trim())
            participantResult.firstName = capitalize(firstName.trim())
            participantResult.participantId = shortHash(`${participantResult.firstName} ${participantResult.lastName}`)
            break
          }
          case 'license':
            // participantResult.license = $(td).text().trim()
            break
          case 'team':
            const team = TeamParser.parseTeamName($(td).text().trim())

            participantResult[columns[index].type] = team?.name
            break
          case 'uciId':
            participantResult[columns[index].type] = $(td).text().replace(/\s/g, '').trim()
            break
          case 'racePoints': {
            participantResult.racePoints[columns[index].date!] = +$(td).text().trim()
            break
          }
        }
      })

      if (participantResult.uciId) {
        // If athlete has an override for the current year team, use that instead
        const teamOverride = TeamParser.getManualTeamForAthlete(participantResult.uciId, serieSummary.year)
        if (teamOverride) participantResult.team = teamOverride.name
      }

      individualResults.push(participantResult as ParticipantSerieResult)
    })

    const categoryGender = categoryName.includes('Men') ? 'M' : categoryName.includes('Women') ? 'F' : 'X'
    const categoryLabel = await transformCategoryLabel(categoryName, {
      eventName: serieSummary.name,
      organizerAlias: serieSummary.organizerAlias,
      year: serieSummary.year!
    })
    const alias = formatCategoryAlias(categoryLabel)

    combinedSeriesCategories.push({
      alias,

      label: categoryLabel,
      gender: categoryGender,
      results: individualResults,

      updatedAt: serieSummary.updatedAt,
    })
  }

  return {
    categories: combinedSeriesCategories,
    sourceUrls: [SOURCE_URL_PREFIX + sourceFile],
  }
}

// Classic green table
async function parseSerieTeamResults(
  fileContent: string,
  sourceFile: string,
  serieSummary: UpdateSerie,
): Promise<CreateSerieResults['team']> {
  logger.info('Parsing team results from ' + sourceFile)

  const $ = cheerio.load(fileContent)

  const combinedSeriesCategories: CreateSerieTeamCategory[] = []

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

            teamResult[columns[index].type] = team?.name || 'Independent'
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
    const categoryLabel = await transformCategoryLabel(categoryName, {
      eventName: serieSummary.name,
      organizerAlias: serieSummary.organizerAlias,
      year: serieSummary.year!
    })
    const alias = formatCategoryAlias(categoryLabel)

    combinedSeriesCategories.push({
      alias,
      label: categoryLabel,
      gender: categoryGender,
      results: teamResults,
      updatedAt: serieSummary.updatedAt,
    })
  }

  return {
    categories: combinedSeriesCategories,
    sourceUrls: [SOURCE_URL_PREFIX + sourceFile],
  }
}

// Orange table
const parseSerieTeamResultsFromOrangeTable = async (
  fileContent: string,
  sourceFile: string,
  serieSummary: UpdateSerie,
): Promise<CreateSerieResults['team']> => {
  const $ = cheerio.load(fileContent)

  logger.info('Parsing team results from ' + sourceFile)
  const combinedSeriesCategories: CreateSerieTeamCategory[] = []

  const categoryRows = $('table.dataframe tbody tr.category-row')
  if (!categoryRows.length) throw new Error('No category rows found: ' + sourceFile)

  for (const categoryRow of categoryRows.toArray()) {
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

          teamResult.team = team?.name || 'Independent'
        } else if (index === 2) teamResult.totalPoints = +$(cell).text().trim()
      })

      teamResults.push(teamResult as TeamSerieResult)
    })

    const categoryGender = categoryName.includes('Men') ? 'M' : categoryName.includes('Women') ? 'F' : 'X'
    const categoryLabel = await transformCategoryLabel(categoryName, {
      eventName: serieSummary.name,
      organizerAlias: serieSummary.organizerAlias,
      year: serieSummary.year!
    })
    const alias = formatCategoryAlias(categoryLabel)

    combinedSeriesCategories.push({
      alias,
      label: categoryLabel,
      gender: categoryGender,
      results: teamResults,
      updatedAt: serieSummary.updatedAt,
    })
  }

  return {
    categories: combinedSeriesCategories,
    sourceUrls: [SOURCE_URL_PREFIX + sourceFile],
  }
}