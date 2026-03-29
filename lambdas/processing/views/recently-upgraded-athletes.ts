import data from 'shared/data.ts'
import defaultLogger from 'shared/logger.ts'
import type { RecentlyUpgradedAthletes, TDiscipline } from 'shared/types.ts'
import { SCRIPT_NAME } from '../config.ts'

const logger = defaultLogger.child({ parser: SCRIPT_NAME })

export const createViewRecentlyUpgradedAthletes = async () => {
  const allAthletes = await data.get.athletes()

  logger.info(`Updating recently upgraded athletes view...`)

  const recentlyUpgradedAthletes: RecentlyUpgradedAthletes = []

  ;(['ROAD', 'CX'] as TDiscipline[]).forEach((discipline) => {
    allAthletes.forEach((athlete) => {
      if (athlete.latestUpgrade?.[discipline]) {
        const latestUpgrade = athlete.latestUpgrade[discipline]

        // Ignore low confidence upgrades
        if (latestUpgrade.confidence < 0.5 || !latestUpgrade.date) return

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

  logger.info(`Total athletes processed: ${allAthletes.length}`)

  try {
    logger.info(`Uploading ${recentlyUpgradedAthletes.length} recently upgraded athletes view`)
    await data.update.viewRecentlyUpgradedAthletes(recentlyUpgradedAthletes)
  } catch (error) {
    console.trace(error)
    logger.error(`Failed to save recently upgraded athletes view: ${(error as Error).message}`, { error })
  }
}