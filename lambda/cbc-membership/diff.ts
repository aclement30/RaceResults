import fs from 'fs'
import { getLocalMembershiFiles } from './utils.ts'
import { LOCAL_STORAGE_PATH } from '../ingestion/shared/config.ts'
import { MEMBERSHIP_OUTPUT_PATH, SCRIPT_NAME } from './config.ts'
import type { AthleteMembershipData } from './types.ts'
import defaultLogger from '../ingestion/shared/logger.ts'
import { diff as consoleDiff } from 'jest-diff'
import _ from 'lodash'

const logger = defaultLogger.child({ parser: SCRIPT_NAME })

const DISCIPLINES = ['ROAD', 'CYCLOCROSS']
const currentYear = new Date().getFullYear()

const loadFile = (filename: string): Record<string, AthleteMembershipData> => {
    const filePath = `${LOCAL_STORAGE_PATH}/${MEMBERSHIP_OUTPUT_PATH}${filename}`
    const fileContent = fs.readFileSync(filePath, 'utf8')

    if (!fileContent) {
      logger.warn(`File ${filePath} is empty or does not exist.`)
      return {}
    }

    try {
      const membershipData = JSON.parse(fileContent) as Record<string, AthleteMembershipData>
      return membershipData
    } catch (error) {
      logger.error(`Failed to parse file ${filePath}: ${(error as any).message}`, { error })
      return {}
    }
  }

;(async () => {
  const localFiles = getLocalMembershiFiles().reverse()
  // const localFiles = ['20250620T203523.json', '20241231.json']

  const lastFileContent = loadFile(localFiles[0])
  const beforeLastFileContent = loadFile(localFiles[1])

  console.log('New memberships:')
  Object.keys(lastFileContent).forEach((uciId) => {
    const currentMembership = lastFileContent[uciId]
    const previousMembership = beforeLastFileContent[uciId]

    if (!previousMembership) {
      console.log(currentMembership)
    }
  })

  console.log('Updated memberships:')
  Object.keys(lastFileContent).forEach((uciId) => {
    const currentMembership = lastFileContent[uciId]
    const previousMembership = beforeLastFileContent[uciId]

    if (!previousMembership) return

    const currentLicenses = currentMembership.licenses
    const previousLicenses = previousMembership?.licenses

    DISCIPLINES.forEach((discipline) => {
      const currentLicense = currentLicenses.find(l => l.discipline === discipline && l.year === currentYear)
      const previousLicense = previousLicenses?.find(l => l.discipline === discipline && l.year === currentYear)

      if (currentLicense && (!previousLicense || currentLicense.text !== previousLicense.text)) {
        console.log(`${uciId} - ${currentMembership.firstName} ${currentMembership.lastName}`)
        console.log(consoleDiff(currentLicense, previousLicense || {}, {
          aAnnotation: 'New',
          bAnnotation: 'Existing',
        }))
      }
    })
  })

  console.log('Deleted memberships:')
  Object.keys(beforeLastFileContent).forEach((uciId) => {
    const previousMembership = beforeLastFileContent[uciId]
    const currentMembership = lastFileContent[uciId]

    if (!currentMembership) {
      console.log(previousMembership)
    }
  })
})()