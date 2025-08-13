import { fetchRawMembershipFile, fetchRawMembershipFilesList } from './utils.ts'
import { CLEAN_ATHLETE_CATEGORIES_FILE, SCRIPT_NAME } from './config.ts'
import defaultLogger from '../shared/logger.ts'
import type { CleanAthleteCategoryInfo } from '../watcher/athletes/types.ts'
import { s3 as RRS3 } from '../shared/utils.ts'

const logger = defaultLogger.child({ parser: SCRIPT_NAME })

const DISCIPLINES = ['ROAD', 'CYCLOCROSS']
const OUTPUT_FILE = CLEAN_ATHLETE_CATEGORIES_FILE

export const cleanData = async () => {
  const rawFiles = await fetchRawMembershipFilesList()
  const processedFiles: string[] = []

  const athleteCategories: Record<string, CleanAthleteCategoryInfo> = {}

  if (!rawFiles.length) {
    return {
      processedFiles: [],
    }
  }

  for (const filePath of rawFiles) {
    const basename = filePath.split('/').pop() || ''
    const date = basename.slice(0, 4) + '-' + basename.slice(4, 6) + '-' + basename.slice(6, 8)

    try {
      logger.info(`Loading membership data from: ${filePath}`)
      const membershipData = await fetchRawMembershipFile(filePath)

      logger.info(`Processing file: ${basename}`, { totalRows: Object.keys(membershipData).length })
      processedFiles.push(basename)

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
              uciId,
              skillLevels: {},
              ageCategory: null,
            }
          }

          const disciplineKey = license.discipline.replace('CYCLOCROSS', 'CX') as 'ROAD' | 'CX'

          if (!athleteCategories[uciId].skillLevels[disciplineKey]) athleteCategories[uciId].skillLevels[disciplineKey] = {}

          athleteCategories[uciId].skillLevels[disciplineKey][date] = skillLevel
          athleteCategories[uciId].ageCategory = ageCategory
        })
      })
    } catch (error) {
      logger.error(`Failed to parse file ${filePath}: ${(error as any).message}`, { error })
    }
  }

  logger.info(`Saving categories data for ${Object.keys(athleteCategories).length} athletes to: ${OUTPUT_FILE}`)

  try {
    await RRS3.writeFile(OUTPUT_FILE, JSON.stringify(athleteCategories))
  } catch (error) {
    logger.error(`Failed to save categories data: ${(error as Error).message}`, { error })
  }

  return {
    processedFiles,
    totalAthletes: Object.keys(athleteCategories).length,
  }
}
