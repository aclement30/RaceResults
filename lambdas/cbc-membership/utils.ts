import { CLEAN_ATHLETES_FILE } from '../watcher/athletes/config.ts'
import type { Athlete } from '../../src/types/athletes.ts'
import type { AthleteMembershipData } from './types.ts'
import defaultLogger from '../shared/logger.ts'
import { MEMBERSHIP_OUTPUT_PATH, SCRIPT_NAME } from './config.ts'
import { s3 as RRS3 } from '../shared/utils.ts'

const logger = defaultLogger.child({ parser: SCRIPT_NAME })

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export const fetchUciIdList = async (): Promise<string[]> => {
  logger.info(`Loading athlete clean data from: ${CLEAN_ATHLETES_FILE}`)

  const fileContent = await RRS3.fetchFile(CLEAN_ATHLETES_FILE)

  if (!fileContent) throw new Error(`File ${CLEAN_ATHLETES_FILE} not found!`)

  const athletes: Record<string, Athlete> = JSON.parse(fileContent)

  return Object.keys(athletes)
}

export const fetchRawMembershipFilesList = async (): Promise<string[]> => {
  const { files } = await RRS3.fetchDirectoryFiles(MEMBERSHIP_OUTPUT_PATH)

  if (!files || files.length === 0) {
    logger.warn(`No raw membership files found in ${MEMBERSHIP_OUTPUT_PATH}`)
    return []
  }

  return files.filter(f => f.Key!.endsWith('.json')).map((f) => f.Key!).sort((a, b) => a.localeCompare(b))
}

export const fetchRawMembershipFile = async (filePath: string): Promise<Record<string, AthleteMembershipData | null>> => {
  const fileContent = await RRS3.fetchFile(filePath)

  if (!fileContent) {
    logger.warn(`File ${filePath} is empty or does not exist.`)

    return {}
  }

  return JSON.parse(fileContent) as Record<string, AthleteMembershipData | null>
}