import { SCRIPT_NAME } from './config.ts'
import defaultLogger from '../shared/logger.ts'
import type { AthleteSkillCategory } from '../shared/types.ts'
import data from '../shared/data.ts'

const logger = defaultLogger.child({ parser: SCRIPT_NAME })

const DISCIPLINES = ['ROAD', 'CYCLOCROSS']

export const cleanData = async () => {
  const rawImportDates = await data.get.rawBCMembershipDates()
  const processedDates: string[] = []

  const athleteCategories: Record<string, AthleteSkillCategory> = {}

  if (!rawImportDates.length) {
    return {
      processedDates: [],
    }
  }

  for (const importDate of rawImportDates) {
    try {
      logger.info(`Loading membership data from: ${importDate}`)
      const membershipData = await data.get.rawBCMemberships(importDate)

      logger.info(`Processing file: ${importDate}`, { totalRows: Object.keys(membershipData).length })
      processedDates.push(importDate)

      Object.keys(membershipData).forEach((uciId) => {
        const licenses = membershipData[uciId]?.licenses || []

        licenses.forEach((license) => {
          if (!DISCIPLINES.includes(license.discipline)) {
            logger.warn(`Ignoring license with unsupported discipline: ${license.discipline}`, { uciId, license })
            return
          }

          let skillLevel = license.level || '5'
          if (skillLevel.startsWith('Under')) skillLevel = '5'

          let ageCategory = license.ageCategory?.toUpperCase() || null
          if (ageCategory && ageCategory.startsWith('UNDER')) ageCategory = ageCategory.replace('UNDER ', 'U').trim()
          else if (ageCategory && ageCategory.startsWith('MASTER')) ageCategory = 'MASTER'

          if (!athleteCategories[uciId]) {
            athleteCategories[uciId] = {
              athleteUciId: uciId,
              skillLevels: {},
              ageCategory: null,
            }
          }

          const disciplineKey = license.discipline.replace('CYCLOCROSS', 'CX') as 'ROAD' | 'CX'

          if (!athleteCategories[uciId].skillLevels[disciplineKey]) athleteCategories[uciId].skillLevels[disciplineKey] = {}

          athleteCategories[uciId].skillLevels[disciplineKey][importDate] = skillLevel
          athleteCategories[uciId].ageCategory = ageCategory
        })
      })
    } catch (error) {
      logger.error(`Failed to parse data for ${importDate}: ${(error as any).message}`, { error })
    }
  }

  logger.info(`Saving categories data for ${Object.keys(athleteCategories).length} athletes`)

  for (const uciId in athleteCategories) {
    const athlete = athleteCategories[uciId]

    if (!athlete.skillLevels) continue

    for (const discipline in athlete.skillLevels) {
      const disciplineKey = discipline as 'ROAD' | 'CX'

      // Levels are a key/value object in the format { date: level }, we want to keep only the oldest value (earliest date) for each level
      // Start by grouping levels by level, then keep the oldest date for each level, and finally reshape back to the original format
      const levelsByLevel: Record<string, { date: string, level: string }[]> = {}
      for (const date in athlete.skillLevels[disciplineKey]) {
        const level = athlete.skillLevels[disciplineKey][date]
        if (!levelsByLevel[level]) levelsByLevel[level] = []
        levelsByLevel[level].push({ date, level })
      }

      const oldestLevels: Record<string, string> = {}
      for (const level in levelsByLevel) {
        const oldestEntry = levelsByLevel[level].reduce((oldest, entry) => {
          return entry.date < oldest.date ? entry : oldest
        }, levelsByLevel[level][0])
        oldestLevels[oldestEntry.date] = oldestEntry.level
      }

      athlete.skillLevels[disciplineKey] = oldestLevels
    }
  }

  try {
    await data.update.athletesCategories(Object.values(athleteCategories))
  } catch (error) {
    logger.error(`Failed to save categories data: ${(error as Error).message}`, { error })
  }

  return {
    processedDates,
    totalAthletes: Object.keys(athleteCategories).length,
  }
}
