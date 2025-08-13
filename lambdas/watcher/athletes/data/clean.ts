import { isEqual } from 'lodash-es'
import { set } from 'lodash-es'
import { cloneDeep } from 'lodash-es'
import { diff } from 'deep-object-diff'
import { diff as consoleDiff } from 'jest-diff'
import { S3ServiceException } from '@aws-sdk/client-s3'
import defaultLogger from '../../../shared/logger.ts'
import { CLEAN_ATHLETES_FILE, PARSER_NAME } from '../config.ts'
import type { AthleteOverrides, CleanAthlete, CleanAthleteCategoryInfo, ExtractedEventAthlete } from '../types.ts'
import { s3 as RRS3 } from '../../../shared/utils.ts'
import { DEBUG } from '../../../shared/config.ts'

const logger = defaultLogger.child({ parser: PARSER_NAME })

export default async ({ athletes, athletesCategories, athletesOverrides, year }: {
  athletes: ExtractedEventAthlete[],
  athletesCategories: Record<string, CleanAthleteCategoryInfo>,
  athletesOverrides: AthleteOverrides,
  year: number
}) => {
  const existingAthletes = await loadAthleteCleanData()
  logger.info(`${Object.keys(existingAthletes).length} athletes found in: ${CLEAN_ATHLETES_FILE}`)

  const updatedAthletes: Record<string, CleanAthlete> = {
    ...existingAthletes
  }

  const ignoreChangedFields: Array<keyof CleanAthlete> = ['lastUpdated', 'licenses']

  for (const athlete of athletes) {
    if (updatedAthletes[athlete.uciId]) {
      const existingAthlete = updatedAthletes[athlete.uciId]

      if (isEqual(existingAthlete, athlete)) {
        // console.log(`Matching athlete found for UCI ID: ${athlete.uciId}, no changes.`)
      } else {
        const partialMergedProfile = reconcileAthleteProfiles(existingAthlete, athlete, year)
        const changedFields = diff(existingAthlete, partialMergedProfile)

        // @ts-ignore
        if (DEBUG && Object.keys(changedFields).some((field) => !ignoreChangedFields.includes(field))) {
          console.log(`Matching athlete found for UCI ID: ${athlete.uciId}:`)
          console.log(consoleDiff(partialMergedProfile, existingAthlete, {
            aAnnotation: 'New',
            bAnnotation: 'Existing',
          }))
          console.log(diff(existingAthlete, partialMergedProfile))
        }
        updatedAthletes[athlete.uciId] = partialMergedProfile
      }
    } else {
      updatedAthletes[athlete.uciId] = athlete
    }
  }

  for (const uciId of Object.keys(updatedAthletes)) {
    const athlete = updatedAthletes[uciId]

    const {
      level: currentSkillLevel,
      ageCategory: currentAgeCategory,
    } = getCurrentCategory(athletesCategories[uciId], 'ROAD')

    if (currentSkillLevel) {
      if (!athlete.skillLevel) athlete.skillLevel = {}
      athlete.skillLevel.ROAD = currentSkillLevel
    }
    if (currentAgeCategory) {
      if (!athlete.ageCategory) athlete.ageCategory = {}
      athlete.ageCategory.ROAD = currentAgeCategory
    }

    // Apply overrides, if any
    if (athletesOverrides.athleteData?.[athlete.uciId]) {
      const overrides = athletesOverrides.athleteData[athlete.uciId]

      Object.keys(overrides).forEach(key => {
        if (DEBUG) logger.info(`Applying override for athlete ${athlete.uciId}: ${key} = ${overrides[key]}`)
        const value = overrides[key]
        set(athlete, key, value)
      })
    }
  }

  logger.info(`Saving ${Object.keys(updatedAthletes).length} athletes to: ${CLEAN_ATHLETES_FILE}`)

  try {
    await RRS3.writeFile(CLEAN_ATHLETES_FILE, JSON.stringify(updatedAthletes))
  } catch (error) {
    logger.error(`Failed to save athletes to ${CLEAN_ATHLETES_FILE}:` + (error as any).message, { error })
  }

  return updatedAthletes
}

const reconcileAthleteProfiles = (
  existingProfile: CleanAthlete,
  newProfile: Partial<CleanAthlete>,
  year: number
): CleanAthlete => {
  const mergedProfile: CleanAthlete = cloneDeep(existingProfile)

  Object.keys(newProfile).forEach((key) => {
    if ([
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

const loadAthleteCleanData = async (): Promise<Record<string, CleanAthlete>> => {
  try {
    const fileContent = await RRS3.fetchFile(CLEAN_ATHLETES_FILE)

    if (!fileContent) return {}

    const athletes: Record<string, CleanAthlete> = JSON.parse(fileContent)

    return athletes
  } catch (error) {
    if (error instanceof S3ServiceException && error.name === 'NoSuchKey') {
      return {}
    }

    throw error
  }
}

const getCurrentCategory = (athleteCategoryInfo: CleanAthleteCategoryInfo | undefined, discipline: 'ROAD' | 'CX'): {
  level?: string,
  ageCategory?: string | null,
} => {
  if (!athleteCategoryInfo) return {}

  if (!athleteCategoryInfo.skillLevels || !athleteCategoryInfo.skillLevels[discipline]) return {}

  const skillLevels = athleteCategoryInfo.skillLevels[discipline]
  const mostRecentLevelDate = Object.keys(skillLevels).sort().reverse()[0]
  const mostRecentLevel = skillLevels[mostRecentLevelDate]
  const ageCategory = athleteCategoryInfo.ageCategory

  return {
    level: mostRecentLevel,
    ageCategory,
  }
}