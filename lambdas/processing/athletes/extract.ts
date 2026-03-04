import { validateUCIId } from '../utils.ts'
import defaultLogger from '../../shared/logger.ts'
import { DEFAULT_EVENT_FILTERS, SCRIPT_NAME } from '../config.ts'
import type { RawAthlete, RawAthleteRaceResult } from '../types.ts'
import { capitalize, formatProvince } from '../../shared/utils.ts'
import { DEBUG } from '../../shared/config.ts'
import data from '../../shared/data.ts'
import type { EventSummary } from '../../shared/types.ts'

const logger = defaultLogger.child({ parser: SCRIPT_NAME })

export const extractAthletes = async (
  options: { year: number, eventHash?: string }
): Promise<{ eventHashes: string[] }> => {
  logger.info(`Extracting athletes for year ${options.year} with filters: ${JSON.stringify(options)}...`)

  const { allEventsAthletes, eventHashes } = await extractAllEventAthletes(options)

  await saveAllAthletes(allEventsAthletes, options.year)

  return { eventHashes }
}

const extractAllEventAthletes = async (options: { year: number, eventHash?: string }) => {
  const events = await data.get.events({ ...options, ...DEFAULT_EVENT_FILTERS })

  const promises = await Promise.allSettled(events.map(async (event) => extractEventAthletes(event)))

  const allEventsAthletes: Record<string, RawAthlete[]> = {}
  let totalAthletesCount = 0
  const eventHashes: string[] = []

  promises.forEach((parseResult, i) => {
    if (parseResult.status === 'fulfilled') {
      allEventsAthletes[events[i].hash] = parseResult.value
      totalAthletesCount += parseResult.value.length
      eventHashes.push(events[i].hash)
    } else {
      logger.error(`Error while processing event athletes: ${parseResult.reason}`, {
        hash: events[i].hash,
        year: events[i].year,
        error: parseResult.reason
      })
    }
  })

  logger.info(`Total athletes extracted (non-unique): ${totalAthletesCount}`)

  return { allEventsAthletes, eventHashes }
}

const extractEventAthletes = async (event: EventSummary): Promise<RawAthlete[]> => {
  const eventResults = await data.get.eventResults(event.hash, event.year)

  if (!eventResults) {
    logger.warn(`No results found for event ${event.hash} (${event.name} - ${event.date}), skipping athlete extraction`)
    return []
  }

  const allAthletes: Record<string, RawAthlete> = {}
  const eventYear = +event.date.substring(0, 4)

  Object.values(eventResults.athletes).forEach((eventAthlete) => {
    const {
      uciId,
      firstName,
      lastName,
      gender,
      city,
      province,
      license,
      age,
      nationality,
    } = eventAthlete

    if (!uciId) return

    if (!validateUCIId(uciId)) {
      logger.warn(`Invalid UCI ID format for athlete: ${uciId} (${firstName} ${lastName}), skipping`)
      return
    }

    if (allAthletes[uciId]) {
      logger.warn(`Duplicate athlete found: ${firstName} ${lastName} with UCI ID ${uciId}, skipping`)
      return
    }

    if (!firstName || !lastName) {
      logger.warn('Missing first or last name for athlete', { eventAthlete })
      return
    }

    // Validate and process license
    const processedLicense = license?.trim()?.toUpperCase()
    const validLicense = processedLicense && processedLicense !== 'TEMP' ? processedLicense : null

    // Validate gender
    const validGender = gender && [
      'M',
      'F',
      'X'
    ].includes(gender.toUpperCase()) ? gender.toUpperCase() as 'M' | 'F' | 'X' : undefined

    allAthletes[uciId] = {
      uciId,
      firstName: capitalize(firstName),
      lastName: capitalize(lastName),
      gender: validGender,
      city: capitalize(city),
      province: formatProvince(province),
      birthYear: age ? eventYear - age : undefined,
      licenses: validLicense ? { [eventYear]: [validLicense] } : {},
      nationality: nationality?.trim()?.toUpperCase(),
      lastUpdated: event.date
    }
  })

  if (DEBUG) logger.info(`${event.hash} - ${event.name} (${event.date}): ${Object.keys(allAthletes).length || 0} athletes found`)

  return Object.values(allAthletes)
}

const saveAllAthletes = async (allEventsAthletes: Record<string, RawAthlete[]>, year: number) => {
  const promises = await Promise.allSettled(
    Object.entries(allEventsAthletes).map(
      ([eventHash, athletes]) => data.update.rawEventAthletes(athletes, { eventHash, year })
    )
  )

  promises.forEach((result, i) => {
    const eventHash = Object.keys(allEventsAthletes)[i]
    const athletes = allEventsAthletes[eventHash]

    if (result.status === 'fulfilled') {
      logger.info(`Saved ${athletes.length} raw athletes data for event ${eventHash}`)
    } else {
      logger.error(`Error while saving raw athletes: ${result.reason}`, {
        hash: eventHash,
        year,
        error: result.reason
      })
    }
  })
}
