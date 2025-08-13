import defaultLogger from '../../../shared/logger.ts'
import { PARSER_NAME } from '../config.ts'
import type {
  CleanAthlete,
  CleanAthleteEventRaces, CleanAthleteEventUpgradePoints,
  CleanAthleteUpgradeDate
} from '../types.ts'
import { isUpgradePointStale } from '../../../../src/utils/upgrade-points.ts'
import { extractAthleteSkillLevel } from '../../../shared/skill-level.ts'
import type { AthleteCompilations } from '../../../../src/types/athletes.ts'
import { s3 as RRS3 } from '../../../shared/utils.ts'
import { PUBLIC_BUCKET_FILES } from '../../../../src/config/s3.ts'
import { DEBUG } from '../../../shared/config.ts'

const logger = defaultLogger.child({ parser: PARSER_NAME })

export default async (
  {
    athletesData: allAthleteData,
    athletesUpgradePoints: allAthleteUpgradePoints,
    athletesUpgradeDates: allAthleteUpgradeDates,
    athletesRaces: allAthleteRaces,
  }: {
    athletesData: Record<string, CleanAthlete>,
    athletesUpgradePoints: CleanAthleteEventUpgradePoints,
    athletesUpgradeDates: Record<string, CleanAthleteUpgradeDate>,
    athletesRaces: CleanAthleteEventRaces,
  }
) => {
  const recentlyUpgradedAthletes = filterRecentlyUpgradedAthletes(allAthleteData, allAthleteUpgradeDates)
  const pointsCollectors = filterPointsCollectors({
    athletesData: allAthleteData,
    athletesUpgradePoints: allAthleteUpgradePoints,
    athletesUpgradeDates: allAthleteUpgradeDates,
    athletesRaces: allAthleteRaces
  })

  if (DEBUG) {
    console.log({ recentlyUpgradedAthletes })
    console.log({ pointsCollectors })
  }

  logger.info(`Total athletes processed: ${Object.keys(allAthleteData).length}`)

  const compilations: AthleteCompilations = {
    recentlyUpgradedAthletes: recentlyUpgradedAthletes,
    pointsCollectors,
  }

  try {
    logger.info(`Uploading athletes compilations to ${PUBLIC_BUCKET_FILES.athletes.compilations}`)
    await RRS3.writeFile(PUBLIC_BUCKET_FILES.athletes.compilations, JSON.stringify(compilations))
  } catch (error) {
    console.trace(error)
    logger.error(`Failed to save athletes compilations: ${(error as Error).message}`, { error })
  }
}

const filterRecentlyUpgradedAthletes = (
  allAthleteData: Record<string, CleanAthlete>,
  cleanedAthleteUpgradeDates: Record<string, CleanAthleteUpgradeDate>
): AthleteCompilations['recentlyUpgradedAthletes'] => {
  const recentlyUpgradedAthletes: AthleteCompilations['recentlyUpgradedAthletes'] = []

  ;(['ROAD', 'CX'] as Array<'ROAD' | 'CX'>).forEach((discipline) => {
    Object.entries(allAthleteData).forEach(([athleteUciId, athlete]) => {
      const athleteUpgradeInfo = cleanedAthleteUpgradeDates[athleteUciId]

      if (athleteUpgradeInfo && athleteUpgradeInfo[discipline]) {
        const upgradeInfo = athleteUpgradeInfo[discipline]

        // Ignore low confidence upgrades
        if (upgradeInfo.confidence < 0.5) return

        const lastUpgrade = new Date(upgradeInfo.date)
        const now = new Date()
        const diffInDays = Math.floor((now.getTime() - lastUpgrade.getTime()) / (1000 * 60 * 60 * 24))

        if (diffInDays <= 7) { // Filter athletes upgraded in the last 7 days
          recentlyUpgradedAthletes.push({
            athleteUciId,
            date: upgradeInfo.date,
            skillLevel: athlete.skillLevel?.[discipline]!,
            discipline
          })
        }
      }
    })
  })

  return recentlyUpgradedAthletes
}

const filterPointsCollectors = (
  {
    athletesData: allAthleteData,
    athletesUpgradePoints: allAthleteUpgradePoints,
    athletesUpgradeDates: allAthleteUpgradeDates,
    athletesRaces: allAthleteRaces,
  }: {
    athletesData: Record<string, CleanAthlete>,
    athletesUpgradePoints: CleanAthleteEventUpgradePoints,
    athletesUpgradeDates: Record<string, CleanAthleteUpgradeDate>,
    athletesRaces: CleanAthleteEventRaces,
  }
): AthleteCompilations['pointsCollectors'] => {
  const pointsCollectors: AthleteCompilations['pointsCollectors'] = []

  const DISCIPLINE = 'ROAD' as const
  const POINTS_THRESHOLD = 60
  const LAST_UPGRADE_THRESHOLD_DAYS = 30

  Object.entries(allAthleteData).forEach(([athleteUciId, athlete]) => {
    const athleteUpgradeInfo = allAthleteUpgradeDates[athleteUciId]
    const upgradeInfo = athleteUpgradeInfo?.[DISCIPLINE]

    // Ignore athletes whose skill level is not unknown for the discipline
    if (!athlete.skillLevel?.[DISCIPLINE]) return

    // Ignore athletes who are already at the highest skill level OR novice (cat 5)
    if (['1', '5'].includes(athlete.skillLevel[DISCIPLINE])) return

    if (upgradeInfo) {
      // // Ignore low confidence upgrade dates
      if (upgradeInfo.confidence < 0.5) return

      const lastUpgrade = new Date(upgradeInfo.date)
      const now = new Date()
      const diffInDays = Math.floor((now.getTime() - lastUpgrade.getTime()) / (1000 * 60 * 60 * 24))

      // Ignore athletes who have upgraded recently
      if (diffInDays < LAST_UPGRADE_THRESHOLD_DAYS) return
    }

    const athleteUpgradePoints = allAthleteUpgradePoints[athleteUciId]?.filter(upgradePoint => upgradePoint.discipline === DISCIPLINE && (!upgradeInfo || !isUpgradePointStale(upgradePoint.date, upgradeInfo)))

    const totalPoints = athleteUpgradePoints?.reduce((acc, point) => {
      acc[point.type] = (acc[point.type] || 0) + point.points
      return acc
    }, { UPGRADE: 0, SUBJECTIVE: 0 }) || { UPGRADE: 0, SUBJECTIVE: 0 }

    // Ignore athletes under the points threshold
    if (totalPoints.UPGRADE < POINTS_THRESHOLD) return

    const atheteRacesSinceLastUpgrade = allAthleteRaces[athleteUciId]?.filter(race => (!upgradeInfo || race.date > upgradeInfo.date) && race.eventType === 'GRASSROOTS')

    const hasAthleteRacedUp = atheteRacesSinceLastUpgrade?.some(race => {
      const { level, range } = extractAthleteSkillLevel(race.category, {
        name: race.eventName,
        year: +race.date.slice(0, 4),
      })

      if (level) return level < +athlete.skillLevel![DISCIPLINE]!
      if (range) return range[1] < +athlete.skillLevel![DISCIPLINE]!

      return false
    })

    pointsCollectors.push({
      athleteUciId,
      skillLevel: athlete.skillLevel?.[DISCIPLINE],
      discipline: DISCIPLINE,
      points: totalPoints,
      hasRacedUp: hasAthleteRacedUp,
    })
  })

  return pointsCollectors
}
