import defaultLogger from '../../shared/logger.ts'
import { CLEAN_ATHLETE_UPGRADE_DATES_FILE, PARSER_NAME } from '../config.ts'
import type {
  AthleteOverrides,
  CleanAthlete,
  CleanAthleteCategoryInfo,
  CleanAthleteEventRaces,
  CleanAthleteRace, CleanAthleteUpgradeDate,
} from '../types.ts'
import { s3 as RRS3 } from '../../shared/utils.ts'
import { extractAthleteSkillLevel } from '../../shared/skill-level.ts'
import type { TDiscipline } from '../../../../src/types/results.ts'
import { DEBUG } from '../../shared/config.ts'

const logger = defaultLogger.child({ parser: PARSER_NAME })

export default async ({
  athletesData: allAthletesData,
  athletesRaces: allAthletesRaces,
  athletesCategories: allAthletesCategories,
  athletesOverrides
}: {
  athletesData: Record<string, CleanAthlete>,
  athletesRaces: CleanAthleteEventRaces,
  athletesCategories: Record<string, CleanAthleteCategoryInfo>,
  athletesOverrides: AthleteOverrides,
}) => {
  const processingResults = await Promise.allSettled(Object.keys(allAthletesData).map(async (athleteUciId) => {
    const athlete = allAthletesData[athleteUciId]
    const athleteCategory = allAthletesCategories[athleteUciId]
    const athleteRaces = allAthletesRaces[athleteUciId] || []

    return findUpgradeDate(athlete, {
      races: athleteRaces,
      categories: athleteCategory,
      athletesOverrides: athletesOverrides
    })
  }))

  let latestUpgradeByAthletes: Record<string, CleanAthleteUpgradeDate> = {}

  processingResults.forEach((parseResult, i) => {
    const athleteUciId = Object.keys(allAthletesData)[i]

    if (parseResult.status === 'fulfilled') {
      latestUpgradeByAthletes[athleteUciId] = parseResult.value
    } else {
      logger.error(`Error while processing athlete upgrade date: ${parseResult.reason}`, {
        athleteUciId,
        error: parseResult.reason
      })
    }
  })

  logger.info(`Total athletes processed: ${Object.keys(latestUpgradeByAthletes).length}`)

  try {
    logger.info(`Uploading athlete upgrade dates data to ${CLEAN_ATHLETE_UPGRADE_DATES_FILE}`)
    await RRS3.writeFile(CLEAN_ATHLETE_UPGRADE_DATES_FILE, JSON.stringify(latestUpgradeByAthletes))
  } catch (error) {
    console.trace(error)
    logger.error(`Failed to save athlete upgrade dates: ${(error as Error).message}`, { error })
  }

  return latestUpgradeByAthletes
}

const findUpgradeDate = (
  athlete: CleanAthlete,
  { races, categories, athletesOverrides }: {
    races: CleanAthleteRace[],
    categories?: CleanAthleteCategoryInfo,
    athletesOverrides: AthleteOverrides
  },
): CleanAthleteUpgradeDate => {
  const upgradeDates: CleanAthleteUpgradeDate = {}

  ;(['ROAD', 'CX'] as TDiscipline[]).forEach((discipline) => {
    // Check if athlete has overrides for skill levels
    if (athletesOverrides.levelUpgradeDates?.[athlete.uciId]) {
      const upgradeDate = athletesOverrides.levelUpgradeDates[athlete.uciId].find((upgrade) => upgrade.discipline === discipline && upgrade.level === athlete.skillLevel?.[discipline])
      if (upgradeDate) upgradeDates[discipline] = { date: upgradeDate.date, confidence: 1 }
      return
    }

    const currentLevel = athlete.skillLevel?.[discipline] ? +athlete.skillLevel[discipline]! : null

    // If athlete has no skill level or has not yet upgraded from cat 5, skip
    if (!currentLevel || currentLevel === 5) return

    let possibleUpgradeDates: { date: string, level?: number, range?: [number, number], confidence: number }[] = []

    races.forEach((race) => {
      if (race.discipline !== discipline) return

      // Ignore Grassroots events and BC Provincials
      if (!race.eventType || race.eventType === 'GRASSROOTS' || race.eventName.includes('BC Provincial')) return

      const { level, range, confidence } = extractAthleteSkillLevel(race.category, {
        name: race.eventName,
        year: +race.date.slice(0, 4),
      })

      if (level || range) {
        possibleUpgradeDates.push({
          date: race.date,
          level,
          range,
          confidence,
        })
      }
    })

    Object.entries(categories?.skillLevels?.[discipline] || {}).forEach(([date, level]) => {
      possibleUpgradeDates.push({
        date,
        level: +level,
        // 2025-05-12 is the first record of athlete skill levels in the database,
        // so we assume that the confidence is lower for this date.
        // After that date, we assume higher confidence because the athlete memberships data is queried weekly.
        confidence: date === '2025-06-12' ? 0.4 : 0.8,
      })
    })

    // Sort by date ascending
    possibleUpgradeDates = possibleUpgradeDates.sort((a, b) => (a.date > b.date ? -1 : 1)).reverse()

    for (const [index, { date, level, range, confidence }] of possibleUpgradeDates.entries()) {
      if (level && level === currentLevel) {
        upgradeDates[discipline] = {
          date,
          confidence,
        }
        break
      } else if (range && currentLevel >= range[0] && currentLevel <= range[1] && range[1] < currentLevel + 1) {
        // Check if next date is for the previous level or range (eg. cat 3: 4, 4, [3, 4], 4)
        if (possibleUpgradeDates[index + 1]) {
          const nextDate = possibleUpgradeDates[+index + 1]
          if ((nextDate.level && nextDate.level > currentLevel) || (nextDate.range && (nextDate.range[0] > currentLevel || nextDate.range[1] < currentLevel))) {
            continue
          }
        }

        upgradeDates[discipline] = {
          date,
          confidence,
        }
        break
      }
    }

    if (DEBUG && upgradeDates[discipline]) {
      console.log(`${athlete.uciId} - ${athlete.firstName} ${athlete.lastName} (cat ${athlete.skillLevel?.[discipline]}): estimated category upgrade date on ${upgradeDates[discipline].date} (confidence: ${upgradeDates[discipline].confidence})`)
    }
  })

  return upgradeDates
}