import { groupBy, keyBy } from 'lodash-es'
import { DEBUG } from 'shared/config.ts'
import data from 'shared/data.ts'
import defaultLogger from 'shared/logger.ts'
import type { AthleteSkillCategory, AthleteUpgradeDate, BaseAthlete, TDiscipline } from 'shared/types.ts'
import { SCRIPT_NAME } from '../config.ts'
import type { AthleteOverrides } from '../types.ts'

// This is the date of the first record of athlete skill levels in the database, so we assume that the confidence is lower for this date.
const FIRST_RECORD_DATE = '2025-06-12'

const logger = defaultLogger.child({ parser: SCRIPT_NAME })

export const processAthletesUpgradeDates = async ({ athleteIds }: { athleteIds: string[] }) => {
  const [
    allAthletes,
    athletesCategories,
    athletesUpgradeDates,
    athletesOverrides,
  ] = await Promise.all([
    data.get.baseAthletes(),
    data.get.athletesCategories(),
    data.get.athletesUpgradeDates(),
    data.get.athletesOverrides(),
  ])

  let updatedAthletes = allAthletes.filter(({ uciId }) => athleteIds.includes(uciId))

  const athletesCategoriesByUciId = keyBy(athletesCategories, 'athleteUciId')
  const athletesUpgradeDatesByUciId = groupBy(athletesUpgradeDates, 'athleteUciId')

  updatedAthletes = updatedAthletes.map((athlete) => {
    const athleteCategory = athletesCategoriesByUciId[athlete.uciId]
    const previousUpgradeDates = athletesUpgradeDatesByUciId[athlete.uciId] || []

    const latestUpgrade = findUpgradeDate(athlete, {
      categories: athleteCategory,
      previousUpgradeDates,
      athletesOverrides,
    })

    return {
      ...athlete,
      latestUpgrade,
    }
  })

  logger.info(`Total athletes processed: ${updatedAthletes.length}`)

  try {
    logger.info(`Saving ${updatedAthletes.length} athletes with updated upgrade dates`)

    const { validationErrors } = await data.update.baseAthletes(Object.values(updatedAthletes))

    if (validationErrors && Object.keys(validationErrors).length > 0) {
      logger.error(`Validation errors for ${Object.keys(validationErrors).length} athletes:`, { validationErrors })
    }
  } catch (error) {
    logger.error(`Failed to save athletes: ${(error as Error).message}`, { error })
  }
}

const findUpgradeDate = (
  athlete: BaseAthlete,
  { categories, previousUpgradeDates, athletesOverrides }: {
    categories?: AthleteSkillCategory,
    previousUpgradeDates: AthleteUpgradeDate[],
    athletesOverrides: AthleteOverrides
  },
): BaseAthlete['latestUpgrade'] => {
  const upgradeDates: BaseAthlete['latestUpgrade'] = {}

  for (const discipline of ['ROAD', 'CX'] as TDiscipline[]) {
    // Check if athlete has overrides for skill levels
    if (athletesOverrides.levelUpgradeDates?.[athlete.uciId]) {
      const upgradeDate = athletesOverrides.levelUpgradeDates[athlete.uciId].find((upgrade) => upgrade.discipline === discipline && upgrade.level === athlete.skillLevel?.[discipline])
      if (upgradeDate) upgradeDates[discipline] = { date: upgradeDate.date, confidence: 1 }
      continue
    }

    let possibleUpgradeDates: { date: string, confidence: number }[] = []

    const currentLevel = athlete.skillLevel?.[discipline] ? +athlete.skillLevel[discipline]! : null

    // If athlete has no skill level or has not yet upgraded from cat 5, skip
    if (!currentLevel || currentLevel === 5) continue

    Object.entries(categories?.skillLevels?.[discipline] || {}).forEach(([date]) => {
      possibleUpgradeDates.push({
        date,
        // 2025-06-12 is the first record of athlete skill levels in the database,
        // so we assume that the confidence is lower for this date.
        // After that date, we assume higher confidence because the athlete memberships data is queried weekly.
        confidence: date === FIRST_RECORD_DATE ? 0.4 : 0.8,
      })
    })

    // Check if athlete has a previous upgrade date for that discipline
    const matchingPreviousUpgradeDate = previousUpgradeDates.find(d => d.discipline === discipline)
    if (matchingPreviousUpgradeDate) possibleUpgradeDates.push({
      date: matchingPreviousUpgradeDate.date,
      confidence: matchingPreviousUpgradeDate.confidence,
    })

    // Sort by date ascending
    possibleUpgradeDates = possibleUpgradeDates.sort((a, b) => a.date.localeCompare(b.date))

    // Take the most recent possible upgrade date as the estimated upgrade date
    upgradeDates[discipline] = possibleUpgradeDates[possibleUpgradeDates.length - 1]

    if (DEBUG && upgradeDates[discipline]) {
      logger.info(`${athlete.uciId} - ${athlete.firstName} ${athlete.lastName} (cat ${athlete.skillLevel?.[discipline]}): estimated category upgrade date on ${upgradeDates[discipline].date} (confidence: ${upgradeDates[discipline].confidence})`)
    }
  }

  return upgradeDates
}