import fs from 'fs'
import { getLocalMembershiFiles } from './utils.ts'
import { LOCAL_STORAGE_PATH } from '../ingestion/shared/config.ts'
import { CLEAN_ATHLETE_CATEGORIES_FILE, MEMBERSHIP_OUTPUT_PATH, SCRIPT_NAME } from './config.ts'
import type { AthleteMembershipData } from './types.ts'
import defaultLogger from '../ingestion/shared/logger.ts'
import type { CleanAthleteCategoryInfo } from '../ingestion/athletes/types.ts'
import { s3 as RRS3 } from '../ingestion/shared/utils.ts'

const logger = defaultLogger.child({ parser: SCRIPT_NAME })

const DISCIPLINES = ['ROAD', 'CYCLOCROSS']
const OUTPUT_FILE = CLEAN_ATHLETE_CATEGORIES_FILE

;(async () => {
  const localFiles = getLocalMembershiFiles()

  const athleteCategories: Record<string, CleanAthleteCategoryInfo> = {}

  for (const filename of localFiles) {
    const filePath = `${LOCAL_STORAGE_PATH}/${MEMBERSHIP_OUTPUT_PATH}${filename}`
    const date = filename.slice(0, 4) + '-' + filename.slice(4, 6) + '-' + filename.slice(6, 8)
    const fileContent = fs.readFileSync(filePath, 'utf8')

    if (!fileContent) {
      logger.warn(`File ${filePath} is empty or does not exist.`)
      continue
    }

    try {
      const membershipData = JSON.parse(fileContent) as Record<string, AthleteMembershipData>

      logger.info(`Processing file: ${filename}`, { totalRows: Object.keys(membershipData).length })

      Object.keys(membershipData).forEach((uciId) => {
        const licenses = membershipData[uciId].licenses

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
})()