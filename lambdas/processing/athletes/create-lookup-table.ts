import data from 'shared/data.ts'
import defaultLogger from 'shared/logger.ts'
import { SCRIPT_NAME } from '../config.ts'

const logger = defaultLogger.child({ parser: SCRIPT_NAME })

export const createAthleteLookupTable = async () => {
  logger.info('Creating athletes lookup table...')

  const [
    athletes,
    allManualEdits,
  ] = await Promise.all([
    data.get.baseAthletes(),
    data.get.athleteManualEdits(),
  ])

  logger.info(`Processing ${athletes.length} athletes to create lookup table`)

  const duplicates: Record<string, string[]> = {}
  const lookupTable: Record<string, string> = {}

  for (const athlete of athletes) {
    const key = `${athlete.firstName?.toLowerCase() || ''}|${athlete.lastName?.toLowerCase() || ''}`.trim()

    if (lookupTable[key]) {
      const conflictingUciId = lookupTable[key]
      logger.warn(`Duplicate key found in lookup table: ${key} for UCI ID ${athlete.uciId}, existing UCI ID: ${conflictingUciId}`)

      if (!duplicates[key]) duplicates[key] = []
      duplicates[key].push(athlete.uciId, conflictingUciId)

      delete lookupTable[key] // Remove the conflicting entry

      continue
    } else if (duplicates[key]) {
      logger.warn(`Duplicate key found in lookup table: ${key} for UCI ID ${athlete.uciId}, existing UCI ID: ${duplicates[key].join(',')}`)
      duplicates[key].push(athlete.uciId)
      continue
    }

    lookupTable[key] = athlete.uciId
  }

  const athleteWithAlternateNames = allManualEdits.filter(edit => edit.alternateNames?.length)
  if (athleteWithAlternateNames.length > 0) {
    logger.info(`Adding alternate names from ${athleteWithAlternateNames.length} athletes to the lookup table`)

    for (const partialAthlete of athleteWithAlternateNames) {
      for (const alternateName of partialAthlete.alternateNames!) {
        const [firstName, ...lastNameParts] = alternateName.trim().split(' ')
        const key = `${firstName?.toLowerCase() || ''}|${lastNameParts.join(' ').toLowerCase()}`.trim()

        if (lookupTable[key]) {
          logger.warn(`Duplicate key found in lookup table: ${key} for UCI ID ${partialAthlete.uciId}, existing UCI ID: ${lookupTable[key]}, skipping`)
        } else {
          lookupTable[key] = partialAthlete.uciId
        }
      }
    }
  }

  logger.info(`Saving athletes lookup table`)

  try {
    await data.update.athletesLookup(lookupTable, duplicates)
  } catch (error) {
    logger.error(`Failed to save athletes lookup table:` + (error as any).message, { error })
  }
}