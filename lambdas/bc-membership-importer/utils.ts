import defaultLogger from '../shared/logger.ts'
import { SCRIPT_NAME } from './config.ts'
import data from '../shared/data.ts'

const logger = defaultLogger.child({ parser: SCRIPT_NAME })

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export const fetchUciIdList = async (): Promise<string[]> => {
  logger.info(`Loading list of all athletes`)

  const allAthletes = await data.get.baseAthletes()

  return allAthletes.map(({ uciId }) => uciId)
}