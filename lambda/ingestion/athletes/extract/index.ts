import { loadEventResults } from '../utils.ts'
import defaultLogger from '../../shared/logger.ts'
import { EXTRACTED_ATHLETES_FILE, PARSER_NAME } from '../config.ts'
import type { AthleteOverrides, StoredEventSummary } from '../../../parsers/athletes/types.ts'
import type { Athlete } from '../../../../src/types/athletes.ts'
import type { CleanEventAthlete } from '../../shared/types.ts'
import { capitalize, formatProvince, formatTeamName, s3 as RRS3 } from '../../shared/utils.ts'

const logger = defaultLogger.child({ parser: PARSER_NAME })

export const main = async (storedEventFiles: StoredEventSummary[], athleteOverrides: AthleteOverrides) => {
  const extractionResults = await Promise.allSettled(storedEventFiles.map(async ({ resultsFile, date }) => {
    const eventResults = await loadEventResults(resultsFile)

    // Extract all athletes data from event results
    const extractedEventAthletes = await extractEventAthletes(eventResults.athletes, date, athleteOverrides)

    logger.info(`${date}: ${Object.keys(extractedEventAthletes).length || 0} athletes found`)

    return extractedEventAthletes
  }))

  let combinedEventAthletes: Athlete[] = []

  extractionResults.forEach((parseResult, i) => {
    if (parseResult.status === 'fulfilled') {
      combinedEventAthletes = combinedEventAthletes.concat(parseResult.value)
    } else {
      logger.error(`Error while processing event athletes: ${parseResult.reason}`, {
        hash: storedEventFiles[i].hash,
        year: storedEventFiles[i].year,
        file: storedEventFiles[i].resultsFile,
        error: parseResult.reason
      })
    }
  })

  logger.info(`Total athletes extracted (non-unique): ${combinedEventAthletes.length}`)

  try {
    logger.info(`Uploading extracted athletes data to ${EXTRACTED_ATHLETES_FILE}`)
    await RRS3.writeFile(EXTRACTED_ATHLETES_FILE, JSON.stringify(combinedEventAthletes))
  } catch (error) {
    console.trace(error)
    logger.error(`Failed to save extracted athletes: ${(error as Error).message}`, { error })
  }
}

export const extractEventAthletes = async (eventAthletes: Record<string, CleanEventAthlete>, date: string, overrides: AthleteOverrides): Promise<Athlete[]> => {
  const allAthletes: Record<string, Athlete> = {}
  const year = +date.substring(0, 4)

  Object.values(eventAthletes).forEach((eventAthlete) => {
    const { firstName, lastName, gender, city, province, license, age, team } = eventAthlete
    let { uciId } = eventAthlete

    if (!uciId) {
      // logger.warn(`Athlete ${firstName} ${lastName} has no UCI ID for event (${date}), skipping`)
      return
    }

    if (!uciId.match(/^\d{11}$/)) {
      logger.warn(`Invalid UCI ID format for athlete: ${uciId} (${firstName} ${lastName}), skipping`)
      return
    }

    if (overrides?.replacedUciIds?.[uciId]) {
      const newUciId = overrides.replacedUciIds[uciId].new
      logger.info(`Replaced UCI ID ${uciId} -> ${newUciId} for athlete: ${firstName} ${lastName}`)
      uciId = newUciId
    }

    // if (overrides?.deactivatedUciIds?.includes(uciId)) {
    //   logger.warn(`Deactivated UCI ID ${uciId} for athlete ${firstName} ${lastName}, skipping`)
    //   return
    // }

    if (allAthletes[uciId]) {
      logger.warn(`Duplicate athlete found: ${firstName} ${lastName} with UCI ID ${uciId}, skipping`)
      return
    }

    allAthletes[uciId] = {
      uciId,
      firstName: capitalize(firstName) || null,
      lastName: capitalize(lastName) || null,
      gender: gender || 'X',
      city: capitalize(city) || null,
      province: province ? formatProvince(province) : null,
      birthYear: age ? year - age : new Date().getFullYear(),
      licenses: license && license.toUpperCase() !== 'TEMP' ? { [year]: [license.toUpperCase().trim()] } : {},
      teams: {
        [year]: team && formatTeamName(team) !== 'Independent' ? [formatTeamName(team)] : []
      },
      lastUpdated: date
    }
  })

  return Object.values(allAthletes)
}