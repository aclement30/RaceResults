import { loadEventResults, validateUCIId } from '../utils.ts'
import defaultLogger from '../../../shared/logger.ts'
import {
  EXTRACTED_ATHLETES_FILE,
  PARSER_NAME
} from '../config.ts'
import type { AthleteOverrides, ExtractedEventAthlete, StoredEventSummary } from '../types.ts'
import type { CleanEventAthlete } from '../../../shared/types.ts'
import { capitalize, formatProvince, s3 as RRS3 } from '../../../shared/utils.ts'
import type { EventSummary } from '../../../../src/types/results.ts'
import { DEBUG } from '../../../shared/config.ts'

const logger = defaultLogger.child({ parser: PARSER_NAME })

export default async (storedEventFiles: StoredEventSummary[], athleteOverrides: AthleteOverrides) => {
  // Only extract athletes from BC events
  const filteredStoredEventFiles = storedEventFiles.filter(event => event.location.country === 'CA' && event.location.province === 'BC')

  const extractionResults = await Promise.allSettled(filteredStoredEventFiles.map(async ({
    resultsFile,
    ...eventSummary
  }) => {
    const eventResults = await loadEventResults(resultsFile)

    // Extract all athletes data from event results
    const extractedEventAthletes = await extractEventAthletes(eventResults.athletes, eventSummary, athleteOverrides)
    if (DEBUG) logger.info(`${eventSummary.hash} - ${eventSummary.name} (${eventSummary.date}): ${Object.keys(extractedEventAthletes).length || 0} athletes found`)

    return extractedEventAthletes
  }))

  let combinedEventAthletes: ExtractedEventAthlete[] = []

  extractionResults.forEach((parseResult, i) => {
    if (parseResult.status === 'fulfilled') {
      combinedEventAthletes = combinedEventAthletes.concat(parseResult.value)
    } else {
      logger.error(`Error while processing event athletes: ${parseResult.reason}`, {
        hash: filteredStoredEventFiles[i].hash,
        year: filteredStoredEventFiles[i].year,
        file: filteredStoredEventFiles[i].resultsFile,
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

  return combinedEventAthletes
}

const extractEventAthletes = async (
  eventAthletes: Record<string, CleanEventAthlete>,
  eventSummary: Pick<EventSummary, 'date'>,
  overrides: AthleteOverrides
): Promise<ExtractedEventAthlete[]> => {
  const allAthletes: Record<string, ExtractedEventAthlete> = {}
  const { date } = eventSummary
  const year = +date.substring(0, 4)

  Object.values(eventAthletes).forEach((eventAthlete) => {
    const {
      firstName,
      lastName,
      gender,
      city,
      province,
      license,
      age,
      team,
      nationality,
    } = eventAthlete
    let { uciId } = eventAthlete

    if (!uciId) return

    if (!validateUCIId(uciId)) {
      logger.warn(`Invalid UCI ID format for athlete: ${uciId} (${firstName} ${lastName}), skipping`)
      return
    }

    if (overrides?.replacedUciIds?.[uciId]) {
      const newUciId = overrides.replacedUciIds[uciId].new
      logger.warn(`Replaced UCI ID ${uciId} -> ${newUciId} for athlete: ${firstName} ${lastName}`)
      uciId = newUciId
    }

    if (allAthletes[uciId]) {
      logger.warn(`Duplicate athlete found: ${firstName} ${lastName} with UCI ID ${uciId}, skipping`)
      return
    }

    if (!firstName || !lastName) {
      logger.warn('Missing first or last name for athlete', { eventAthlete })
      return
    }

    allAthletes[uciId] = {
      uciId,
      firstName: capitalize(firstName),
      lastName: capitalize(lastName),
      gender: gender || undefined,
      city: capitalize(city),
      province: formatProvince(province),
      birthYear: age ? year - age : undefined,
      licenses: license && license.toUpperCase() !== 'TEMP' ? { [year]: [license.toUpperCase().trim()] } : {},
      nationality: nationality?.toUpperCase(),
      lastUpdated: date
    }
  })

  return Object.values(allAthletes)
}