import defaultLogger from '../../shared/logger.ts'
import { SCRIPT_NAME } from '../config.ts'
import type { RecentlyUpgradedAthletes } from '../../../src/types/athletes.ts'
import data from '../../shared/data.ts'
import type { TDiscipline } from '../../../src/types/results.ts'

const logger = defaultLogger.child({ parser: SCRIPT_NAME })

export const createViewRecentlyUpgradedAthletes = async () => {
  const allathletes = await data.get.viewAthletes()

  const recentlyUpgradedAthletes: RecentlyUpgradedAthletes = []

  ;(['ROAD', 'CX'] as TDiscipline[]).forEach((discipline) => {
    allathletes.forEach((athlete) => {
      if (athlete.latestUpgrade?.[discipline]) {
        const latestUpgrade = athlete.latestUpgrade[discipline]

        // Ignore low confidence upgrades
        if (latestUpgrade.confidence < 0.5) return

        const lastUpgrade = new Date(latestUpgrade.date)
        const now = new Date()
        const diffInDays = Math.floor((now.getTime() - lastUpgrade.getTime()) / (1000 * 60 * 60 * 24))

        if (diffInDays <= 7) { // Filter athletes upgraded in the last 7 days
          recentlyUpgradedAthletes.push({
            athleteUciId: athlete.uciId,
            date: latestUpgrade.date,
            skillLevel: athlete.skillLevel?.[discipline]!,
            discipline
          })
        }
      }
    })
  })

  logger.info(`Total athletes processed: ${allathletes.length}`)

  try {
    logger.info(`Uploading ${recentlyUpgradedAthletes.length} recently upgraded athletes view`)
    await data.update.viewRecentlyUpgradedAthletes(recentlyUpgradedAthletes)
  } catch (error) {
    console.trace(error)
    logger.error(`Failed to save recently upgraded athletes view: ${(error as Error).message}`, { error })
  }
}