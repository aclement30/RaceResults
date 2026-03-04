import { cloneDeep, isEqual, keyBy, set } from 'lodash-es'
import { diff } from 'deep-object-diff'
// import { diff as consoleDiff } from 'jest-diff'
import defaultLogger from '../../shared/logger.ts'
import { SCRIPT_NAME } from '../config.ts'
import { DEBUG } from '../../shared/config.ts'
import data from '../../shared/data.ts'
import type { Athlete, AthleteSkillCategory } from '../../shared/types.ts'

const logger = defaultLogger.child({ parser: SCRIPT_NAME })

export const cleanAthletes = async ({ year, eventHashes }: {
  year: number,
  eventHashes: string[]
}): Promise<string[]> => {
  logger.info(`Cleaning athletes data for year ${year} (${eventHashes.join(', ')})...`)

  const [
    existingAthletes,
    athletesOverrides,
    athletesCategories,
  ] = await Promise.all([
    data.get.baseAthletes(),
    data.get.athletesOverrides(),
    data.get.athletesCategories(),
  ])

  logger.info(`${Object.keys(existingAthletes).length} existing athletes`)

  const updatedAthletes: Record<string, Athlete> = keyBy(existingAthletes, 'uciId')

  // List of athletes UCI IDs that were updated or added during this process
  const updatedAthleteIds = new Set<string>()

  const ignoreChangedFields: Array<keyof Athlete> = ['lastUpdated', 'licenses', 'teams', 'uciId']

  for (const eventHash of eventHashes) {
    let eventAthletes

    try {
      eventAthletes = await data.get.rawEventAthletes(eventHash, year)
    } catch (error) {
      logger.error('Failed to fetch event athletes for event ' + eventHash + ': ' + (error as any).message, { error })
      continue
    }

    for (const rawAthlete of eventAthletes) {
      let athleteUciId = rawAthlete.uciId
      // Sometimes we need to replace an UCI ID with another one (e.g. due to a license change), so we can apply these overrides before matching athletes
      if (athletesOverrides.replacedUciIds?.[athleteUciId]) {
        const newUciId = athletesOverrides.replacedUciIds[athleteUciId].new
        logger.warn(`Replaced UCI ID ${athleteUciId} -> ${newUciId} for athlete: ${rawAthlete.firstName} ${rawAthlete.lastName}`)
        athleteUciId = newUciId
        rawAthlete.uciId = newUciId
      }

      if (updatedAthletes[athleteUciId]) {
        const existingAthlete = updatedAthletes[athleteUciId]

        if (isEqual(existingAthlete, rawAthlete)) {
          // logger.info(`Matching athlete found for UCI ID: ${athlete.uciId}, no changes.`)
        } else {
          const partialMergedProfile = reconcileAthleteProfiles(existingAthlete, rawAthlete, year)
          const changedFields = diff(existingAthlete, partialMergedProfile)

          // @ts-ignore
          if (DEBUG && Object.keys(changedFields).some((field) => !ignoreChangedFields.includes(field))) {
            logger.info(`Matching athlete found for UCI ID: ${athleteUciId}:`)
            // console.log(consoleDiff(partialMergedProfile, existingAthlete, {
            //   aAnnotation: 'New',
            //   bAnnotation: 'Existing',
            // }))
            // console.log(diff(existingAthlete, partialMergedProfile))
          }

          updatedAthletes[athleteUciId] = partialMergedProfile
        }
      } else {
        // @ts-ignore - Ignore incompatible gender
        updatedAthletes[athleteUciId] = rawAthlete
      }

      updatedAthleteIds.add(athleteUciId)
    }
  }

  const athletesCategoriesByUciId = keyBy(athletesCategories, 'athleteUciId')

  for (const uciId of Object.keys(updatedAthletes)) {
    const athlete = updatedAthletes[uciId]
    const athleteSkillCategory = athletesCategoriesByUciId[uciId]

    const {
      level: currentSkillLevel,
      ageCategory: currentAgeCategory,
    } = getCurrentCategory(athleteSkillCategory, 'ROAD')

    if (currentSkillLevel) {
      if (!athlete.skillLevel) athlete.skillLevel = {}
      athlete.skillLevel.ROAD = currentSkillLevel
    }
    if (currentAgeCategory) {
      if (!athlete.ageCategory) athlete.ageCategory = {}
      athlete.ageCategory.ROAD = currentAgeCategory
    }
  }

  logger.info(`Saving ${Object.keys(updatedAthletes).length} athletes`)

  try {
    await data.update.baseAthletes(Object.values(updatedAthletes))
  } catch (error) {
    logger.error(`Failed to save athletes:` + (error as any).message, { error })
  }

  return Array.from(updatedAthleteIds)
}

const reconcileAthleteProfiles = (
  existingProfile: Athlete,
  newProfile: Partial<Athlete>,
  year: number
): Athlete => {
  const mergedProfile: Athlete = cloneDeep(existingProfile)

  Object.keys(newProfile).forEach((key) => {
    if ([
      'uciId',
      'teams',
      'licenses',
      'latestUpgrade',
      'lastUpdated'
    ].includes(key)) return // Skip licenses, teams and categories, handled separately

    // @ts-ignore
    if (existingProfile[key] === null && !!newProfile[key]) mergedProfile[key] = newProfile[key]
    else { // @ts-ignore
      if (existingProfile[key] !== newProfile[key] && (newProfile[key] !== null && newProfile[key] !== undefined) && newProfile.lastUpdated >= existingProfile.lastUpdated) {
        // @ts-ignore
        mergedProfile[key] = newProfile[key]
      }
    }
  })

  if (newProfile.licenses?.[year]) {
    for (const license of newProfile.licenses[year]) {
      if (!existingProfile.licenses[year]?.includes(license)) {
        if (!mergedProfile.licenses[year]) mergedProfile.licenses[year] = []
        mergedProfile.licenses[year].push(license)
      }
    }
  }

  if (newProfile.lastUpdated && newProfile.lastUpdated > existingProfile.lastUpdated) mergedProfile.lastUpdated = newProfile.lastUpdated

  return mergedProfile
}

const getCurrentCategory = (athleteSkillCategory: AthleteSkillCategory | undefined, discipline: 'ROAD' | 'CX'): {
  level?: string,
  ageCategory?: string | null,
} => {
  if (!athleteSkillCategory) return {}

  if (!athleteSkillCategory.skillLevels || !athleteSkillCategory.skillLevels[discipline]) return {}

  const skillLevels = athleteSkillCategory.skillLevels[discipline]
  const mostRecentLevelDate = Object.keys(skillLevels).sort().reverse()[0]
  const mostRecentLevel = skillLevels[mostRecentLevelDate]
  const ageCategory = athleteSkillCategory.ageCategory

  return {
    level: mostRecentLevel,
    ageCategory,
  }
}