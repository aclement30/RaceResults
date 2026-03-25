import data from '../../shared/data.ts'
import defaultLogger from '../../shared/logger.ts'
import type { EventSummary } from '../../shared/types.ts'
import { SCRIPT_NAME } from '../config.ts'
import type { RawAthleteRaceResult } from '../types.ts'

const logger = defaultLogger.child({ parser: SCRIPT_NAME })

export const extractRaceResults = async (options: { year: number, eventHashes?: string[] }): Promise<{
  year: number,
  eventHashes: string[],
}> => {
  logger.info(`Extracting race results for year ${options.year} with filters: ${JSON.stringify(options)}...`)

  const { allRaceResults, eventHashes } = await extractAllEventResults(options)

  await saveAllRaceResults(allRaceResults, options.year)

  return { year: options.year, eventHashes }
}

const extractAllEventResults = async (options: { year: number, eventHashes?: string[] }) => {
  const events: EventSummary[] = await data.get.events({ ...options }, { summary: true, includeDrafts: false })

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
        error: result.reason
      })
    }
  })

  logger.info(`Total race results extracted (non-unique): ${totalRaceResults}`)

  return { allRaceResults, eventHashes }
}

const extractEventResults = async (event: EventSummary): Promise<RawAthleteRaceResult[]> => {
  const eventResults = await data.get.eventResults(event.hash, +event.date.slice(0, 4))

  logger.info(`Extracting event results for event ${event.hash} (${event.name} - ${event.date})...`)

  if (!eventResults) return []

  const athleteRaceResults: RawAthleteRaceResult[] = []

  const parentCategories = eventResults.categories.reduce((acc, category) => {
    if (category.parentCategory) acc.add(category.alias)
    return acc
  }, new Set<string>())

  eventResults.categories.forEach((category) => {
    const { results: categoryResults, upgradePoints = [] } = category

    // Skip parent categories
    if (parentCategories.has(category.alias)) return

    Object.values(categoryResults).forEach((participantResult) => {
      const athleteUpgradePoint = upgradePoints?.find(up => up.participantId === participantResult.participantId.toString())

      if (!participantResult.uciId && (!participantResult.firstName || !participantResult.lastName)) {
        if (participantResult.firstName?.length || participantResult.lastName?.length) {
          logger.warn(`Participant ${participantResult.firstName} ${participantResult.lastName} has no UCI ID and partial name, skipping race extraction`, {
            eventHash: event.hash,
          })
        }
        return
      }

      // Ignore DNS results as they don't represent an actual race
      if (participantResult.status === 'DNS') return

      athleteRaceResults.push({
        athleteUciId: participantResult.uciId,
        firstName: participantResult.firstName,
        lastName: participantResult.lastName,
        teamName: participantResult.team,
        date: event.date,
        eventHash: event.hash,
        eventType: event.sanctionedEventType,
        discipline: event.discipline,
        categoryAlias: category.alias,
        categoryLabel: category.label,
        position: participantResult.position,
        status: participantResult.status,
        upgradePoints: athleteUpgradePoint?.points || 0,
        fieldSize: category.fieldSize || 0,
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
