import { groupBy, keyBy, omit } from 'lodash-es'
import defaultLogger from '../../shared/logger.ts'
import { SCRIPT_NAME } from '../config.ts'
import { DEBUG } from '../../shared/config.ts'
import data from '../../shared/data.ts'
import type { RaceEvent } from '../../shared/types.ts'
import type { AthleteRace, AthleteUpgradePoint } from '../../../src/types/athletes.ts'

const logger = defaultLogger.child({ parser: SCRIPT_NAME })

export const createViewAthleteProfiles = async ({ athleteIds, year, eventHashes }: {
  athleteIds: string[],
  year: number,
  eventHashes: string[]
}) => {
  const allEvents = await data.get.events({ year, eventHashes }, { summary: false })

  const keyedEvents = keyBy(allEvents as RaceEvent[], 'hash')

  await processAthletesRaces(athleteIds, keyedEvents, { year, eventHashes })
  await processAthletesUpgradePoints(athleteIds, keyedEvents, { year, eventHashes })
}

const processAthletesRaces = async (
  athleteIds: string[],
  events: Record<string, RaceEvent>,
  { year, eventHashes }: { year: number, eventHashes: string[] }
) => {
  const allAthletesRacesResults = await data.get.athletesRacesResults({ eventHashes, year })
  const allAthletesRacesResultsByAthlete = groupBy(allAthletesRacesResults, 'athleteUciId')

  const promises = await Promise.allSettled(athleteIds.map(async (athleteUciId) => {
    let profile = await data.get.athleteProfile(athleteUciId)

    if (!profile) profile = {
      uciId: athleteUciId,
    }

    const athleteRaceResults = allAthletesRacesResultsByAthlete[athleteUciId] || []

    const shapedRaces = athleteRaceResults.map(race => {
      const event = events[race.eventHash]
      if (!event) {
        logger.error(`Event not found for event: ${race.eventHash}`)
        return null // or skip this point
      }

      const categoryLabel = event.categories.find(c => c.alias === race.category)?.label
      if (!categoryLabel) {
        logger.error(`Category not found for event: ${race.eventHash}`)
        return null // or skip this point
      }

      return {
        ...omit(race, ['athleteUciId', 'firstName', 'lastName', 'fieldSize', 'upgradePoints']),
        eventName: event.name,
        categoryLabel,
      } as AthleteRace
    }).filter(race => !!race) as AthleteRace[]

    profile.races = [
      // Keep existing races that are not related to the processed events, and add the newly shaped ones
      ...(profile.races || []).filter(race => !eventHashes.includes(race.eventHash)),
      ...shapedRaces,
    ]

    // Save athlete profile
    if (DEBUG) logger.info(`Saving athlete profile (races) for ${athleteUciId}`)
    return data.update.athleteProfile(profile)
  }))

  promises.forEach((result, i) => {
    const athleteUciId = athleteIds[i]

    if (result.status === 'rejected') {
      logger.error(`Error while compiling races for athlete profile for ${athleteUciId}:` + result.reason, {
        error: result.reason,
        athleteUciId,
      })
    }
  })
}

const processAthletesUpgradePoints = async (
  athleteIds: string[],
  events: Record<string, RaceEvent>,
  { year, eventHashes }: { year: number, eventHashes: string[] }
) => {
  const allAthletesUpgradePoints = await data.get.athletesUpgradePoints({ eventHashes, year })
  const allAthletesUpgradePointsByAthlete = groupBy(allAthletesUpgradePoints, 'athleteUciId')

  const promises = await Promise.allSettled(athleteIds.map(async (athleteUciId) => {
    let profile = await data.get.athleteProfile(athleteUciId)

    if (!profile) profile = {
      uciId: athleteUciId,
    }

    const athleteUpgradePoints = allAthletesUpgradePointsByAthlete[athleteUciId] || []

    const shapedUpgradePoints = athleteUpgradePoints.map(point => {
      const event = events[point.eventHash]
      if (!event) {
        logger.error(`Event not found for event: ${point.eventHash}`)
        return null // or skip this point
      }

      const categoryLabel = event.categories.find(c => c.alias === point.category)?.label
      if (!categoryLabel) {
        logger.error(`Category not found for event: ${point.eventHash}`)
        return null // or skip this point
      }

      return {
        ...omit(point, ['athleteUciId']),
        eventName: event.name,
        categoryLabel,
      } as AthleteUpgradePoint
    }).filter(point => !!point) as AthleteUpgradePoint[]

    profile.upgradePoints = [
      // Keep existing upgrade points that are not related to the processed events, and add the newly shaped ones
      ...(profile.upgradePoints || []).filter(point => !eventHashes.includes(point.eventHash)),
      ...shapedUpgradePoints,
    ]

    // Save athlete profile
    if (DEBUG) logger.info(`Saving athlete profile (upgrade points) for ${athleteUciId}`)
    return data.update.athleteProfile(profile)
  }))


  promises.forEach((result, i) => {
    const athleteUciId = athleteIds[i]

    if (result.status === 'rejected') {
      logger.error(`Error while compiling upgrade points for athlete profile for ${athleteUciId}:` + result.reason, {
        error: result.reason,
        athleteUciId,
      })
    }
  })
}