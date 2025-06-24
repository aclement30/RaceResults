import { CLEAN_ATHLETES_FILE } from '../ingestion/athletes/config.ts'
import fs from 'fs'
import { LOCAL_STORAGE_PATH } from '../ingestion/shared/config.ts'
import type { Athlete } from '../../src/types/athletes.ts'
import type { AthleteMembershipData } from './types.ts'
import defaultLogger from '../ingestion/shared/logger.ts'
import { MEMBERSHIP_OUTPUT_PATH, SCRIPT_NAME } from './config.ts'

const logger = defaultLogger.child({ parser: SCRIPT_NAME })

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export const getUciIdList = (): string[] => {
  try {
    logger.info(`Loading athlete clean data from: ${CLEAN_ATHLETES_FILE}`)
    const fileContent = fs.readFileSync(`${LOCAL_STORAGE_PATH}/${CLEAN_ATHLETES_FILE}`, 'utf8')

    if (!fileContent) return []

    const athletes: Record<string, Athlete> = JSON.parse(fileContent)

    return Object.keys(athletes)
  } catch (error) {
    throw error
  }
}

export const getExistingMembershipData = (filePath: string): Record<string, AthleteMembershipData> => {
  try {
    logger.info(`Loading completed membership data from: ${filePath}`)
    const fileContent = fs.readFileSync(`${filePath}`, 'utf8')

    if (!fileContent) return {}

    const membershipData: Record<string, AthleteMembershipData> = JSON.parse(fileContent)

    return membershipData
  } catch (error) {
    throw error
  }
}

export const getLocalMembershiFiles = (): string[] => {
  const files = fs.readdirSync(`${LOCAL_STORAGE_PATH}/${MEMBERSHIP_OUTPUT_PATH}`)
  return files.filter(f => f.endsWith('.json')).sort((a, b) => a.localeCompare(b))
}