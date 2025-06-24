import { LOCAL_STORAGE_PATH } from '../ingestion/shared/config.ts'
import { MEMBERSHIP_OUTPUT_PATH, SCRIPT_NAME } from './config.ts'
import { getExistingMembershipData } from './utils.ts'
import type { AthleteLicense, AthleteMembershipData } from './types.ts'
import fs from 'fs'
import defaultLogger from '../ingestion/shared/logger.ts'

const logger = defaultLogger.child({ parser: SCRIPT_NAME })

process.exit(0)

;(async () => {
  const inputFile = `${LOCAL_STORAGE_PATH}/${MEMBERSHIP_OUTPUT_PATH}20250620T191619.json`
  const outputFiles = {
    2024: `${LOCAL_STORAGE_PATH}/${MEMBERSHIP_OUTPUT_PATH}20241231-new.json`,
    2025: `${LOCAL_STORAGE_PATH}/${MEMBERSHIP_OUTPUT_PATH}20250620.json`,
  }

  const membershipData = getExistingMembershipData(inputFile)

  logger.info(`Loaded membership data from ${inputFile}`, { totalRows: Object.keys(membershipData).length })

  const results = {
    2024: {} as Record<string, AthleteMembershipData>,
    2025: {} as Record<string, AthleteMembershipData>,
  }

  for (const uciId of Object.keys(membershipData)) {
    const athlete = membershipData[uciId]
    const licenses = athlete.licenses

    const licensesByYear = licenses.reduce((acc, license) => {
      if (!acc[license.year]) {
        acc[license.year] = []
      }

      if (license.text.startsWith('Road') || license.text.startsWith('Cyclocross')) {
        acc[license.year].push(license)
      } else if (license.text.includes('UCI Cycling for All')) {
        acc[license.year].push({
          year: license.year,
          text: 'UCI Cycling for All',
          discipline: 'ROAD',
          level: '5'
        })
      }

      return acc
    }, {} as Record<string, AthleteLicense[]>)

    for (const year of Object.keys(licensesByYear)) {
      results[year][uciId] = {
        ...athlete,
        licenses: licensesByYear[year],
      }
    }
  }

  logger.info(`Saving membership data for ${Object.keys(results['2024']).length} athletes to: ${outputFiles['2024']}`)

  try {
    fs.writeFileSync(outputFiles['2024'], JSON.stringify(results['2024']))
  } catch (error) {
    logger.error(`Failed to save membership data: ${(error as Error).message}`, { error })
  }

  logger.info(`Saving membership data for ${Object.keys(results['2025']).length} athletes to: ${outputFiles['2025']}`)

  try {
    fs.writeFileSync(outputFiles['2025'], JSON.stringify(results['2025']))
  } catch (error) {
    logger.error(`Failed to save membership data: ${(error as Error).message}`, { error })
  }
})()
