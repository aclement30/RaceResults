import defaultLogger from '../../shared/logger.ts'
import { DUPLICATE_ATHLETES_FILE, PARSER_NAME } from '../config.ts'
import type { Athlete } from '../../../../src/types/athletes.ts'
import { PUBLIC_BUCKET_FILES } from '../../../../src/config/s3.ts'
import { s3 as RRS3 } from '../../shared/utils.ts'
import type { AthleteOverrides } from '../types'

const logger = defaultLogger.child({ parser: PARSER_NAME })

export default async (athletes: Record<string, Athlete>, allAthleteOverrides: AthleteOverrides) => {
  const duplicates: Record<string, string> = {}

  const lookupTable: Record<string, string> = Object.keys(athletes).reduce((acc, uciId) => {
    const athlete = athletes[uciId]
    const key = `${athlete.firstName?.toLowerCase() || ''}|${athlete.lastName?.toLowerCase() || ''}`.trim()

    if (acc[key]) {
      logger.warn(`Duplicate key found in lookup table: ${key} for UCI ID ${uciId}, existing UCI ID: ${acc[key]}`)
      const conflictingUciId = acc[key]
      duplicates[uciId] = key
      duplicates[conflictingUciId] = key
      delete acc[key] // Remove the conflicting entry
    }

    acc[key] = uciId
    return acc
  }, {} as Record<string, string>)

  if (allAthleteOverrides.alternateNames) {
    logger.info(`Adding ${Object.keys(allAthleteOverrides.alternateNames).length} alternate names to the lookup table`)

    Object.entries(allAthleteOverrides.alternateNames).forEach(([key, uciId]) => {
      if (lookupTable[key]) {
        logger.warn(`Duplicate key found in lookup table: ${key} for UCI ID ${uciId}, existing UCI ID: ${lookupTable[key]}, skipping`)
      }

      lookupTable[key] = uciId
    })
  }

  logger.info(`Saving lookup table to: ${PUBLIC_BUCKET_FILES.athletes.lookup}`)

  try {
    await RRS3.writeFile(PUBLIC_BUCKET_FILES.athletes.lookup, JSON.stringify(lookupTable))
    await RRS3.writeFile(DUPLICATE_ATHLETES_FILE, JSON.stringify(duplicates))
  } catch (error) {
    logger.error(`Failed to save athletes to ${PUBLIC_BUCKET_FILES.athletes.lookup}:` + (error as any).message, { error })
  }

  return lookupTable
}