import type { RawAthleteRaceResult } from '../types.ts'
import defaultLogger from '../../shared/logger.ts'
import { SCRIPT_NAME } from '../config.ts'
import data from '../../shared/data.ts'
import type { EventSummary } from '../../shared/types.ts'

const logger = defaultLogger.child({ parser: SCRIPT_NAME })

export const extractRaceResults = async (options: { year: number, eventHash?: string }): Promise<{
  year: number,
  eventHashes: string[],
}> => {
  logger.info(`Extracting race results for year ${options.year} with filters: ${JSON.stringify(options)}...`)

  const { allRaceResults, eventHashes } = await extractAllEventResults(options)

  await saveAllRaceResults(allRaceResults, options.year)

  return { year: options.year, eventHashes }
}

const extractAllEventResults = async (options: { year: number, eventHash?: string }) => {
  const events: EventSummary[] = await data.get.events({ ...options }, { summary: true })

  const promises = await Promise.allSettled(events.map(async (event) => extractEventResults(event)))

  const allRaceResults: Record<string, RawAthleteRaceResult[]> = {}
  let totalRaceResults = 0
  const eventHashes: string[] = []

  promises.forEach((result, i) => {
    if (result.status === 'fulfilled') {
      const { value: raceResults } = result

      allRaceResults[events[i].hash] = raceResults
      totalRaceResults += raceResults.length
      eventHashes.push(events[i].hash)
    } else {
      logger.error(`Error while processing event results: ${result.reason}`, {
        hash: events[i].hash,
        eventName: events[i].name,
        date: events[i].date,
        year: events[i].year,
        error: result.reason
      })
    }
  })

  logger.info(`Total race results extracted (non-unique): ${totalRaceResults}`)

  return { allRaceResults, eventHashes }
}

const extractEventResults = async (event: EventSummary): Promise<RawAthleteRaceResult[]> => {
  const eventResults = await data.get.eventResults(event.hash, event.year)

  logger.info(`Extracting event results for event ${event.hash} (${event.name} - ${event.date})...`)

  if (!eventResults) return []

  const athleteRaceResults: RawAthleteRaceResult[] = []

  Object.keys(eventResults.results).forEach((category) => {
    const { results: categoryResults, upgradePoints = [] } = eventResults.results[category]

    // Skip umbrella categories
    if (eventResults.results[category].combinedCategories) return

    Object.values(categoryResults).forEach((athleteResult) => {
      const athlete = eventResults.athletes[athleteResult.athleteId.toString()]
      const athleteUpgradePoint = upgradePoints.find(up => up.athleteId === athleteResult.athleteId.toString())

      if (!athlete) {
        logger.warn(`Athlete not found for id ${athleteResult.athleteId} in category ${category}, skipping race extraction`, {
          eventHash: event.hash,
        })
        return
      }

      if (!athlete.uciId && (!athlete.firstName || !athlete.lastName)) {
        if (athlete.firstName?.length || athlete.lastName?.length) {
          logger.warn(`Athlete ${athlete.firstName} ${athlete.lastName} has no UCI ID and partial name, skipping race extraction`, {
            eventHash: event.hash,
          })
        }
        return
      }

      // Ignore DNS results as they don't represent an actual race
      if (athleteResult.status === 'DNS') return

      athleteRaceResults.push({
        athleteUciId: athlete.uciId,
        firstName: athlete.firstName,
        lastName: athlete.lastName,
        teamName: athlete.team,
        date: event.date,
        eventHash: event.hash,
        eventType: event.sanctionedEventType,
        discipline: event.discipline,
        category,
        position: athleteResult.position,
        status: athleteResult.status,
        upgradePoints: athleteUpgradePoint?.points || 0,
        fieldSize: eventResults.results[category].fieldSize || 0,
      })
    })
  })

  return athleteRaceResults
}

const saveAllRaceResults = async (allRaceResults: Record<string, RawAthleteRaceResult[]>, year: number) => {
  const promises = await Promise.allSettled(
    Object.entries(allRaceResults).map(
      ([eventHash, raceResults]) => data.update.rawAthletesRaceResults(raceResults, {
        eventHash,
        year
      })
    )
  )

  promises.forEach((result, i) => {
    const eventHash = Object.keys(allRaceResults)[i]
    const raceResults = allRaceResults[eventHash]

    if (result.status === 'fulfilled') {
      logger.info(`Saved ${raceResults.length} raw athletes race results for event ${eventHash}`)
    } else {
      logger.error(`Error while saving athletes race results: ${result.reason}`, {
        hash: eventHash,
        year,
        error: result.reason
      })
    }
  })
}
