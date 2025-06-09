import defaultLogger from '../../shared/logger.ts'
import { PARSER_NAME } from '../config.ts'
import type { AthleteOverrides } from '../../../parsers/athletes/types.ts'
import type { Athlete } from '../../../../src/types/athletes.ts'
import _ from 'lodash'
import { diff } from 'deep-object-diff'
import { diff as consoleDiff } from 'jest-diff'
import { writeFile } from '../../../parsers/athletes/aws-s3.ts'
import fs from 'fs'
import { loadAthleteRegistry } from '../../../parsers/athletes/processor.ts'

const logger = defaultLogger.child({ parser: PARSER_NAME })

export const main = async (athletes: Athlete[], athleteOverrides: AthleteOverrides) => {
  const existingAthletes = await loadAthleteRegistry(filename)
  logger.info(`${Object.keys(existingAthletes).length} athletes found in: ${filename}`)

  const updatedAthletes: Record<string, Athlete> = {
    ...existingAthletes
  }

  const ignoreChangedFields = ['lastUpdated', 'licenses']

  for (const athlete of athletes) {
    if (updatedAthletes[athlete.uciId]) {
      const existingAthlete = updatedAthletes[athlete.uciId]

      if (_.isEqual(existingAthlete, athlete)) {
        // console.log(`Matching athlete found for UCI ID: ${athlete.uciId}, no changes.`)
      } else {
        const partialMergedProfile = reconcileAthleteProfiles(existingAthlete, athlete, year)
        const changedFields = diff(existingAthlete, partialMergedProfile)

        if (Object.keys(changedFields).some(field => !ignoreChangedFields.includes(field))) {
          console.log(`Matching athlete found for UCI ID: ${athlete.uciId}:`)
          console.log(consoleDiff(partialMergedProfile, existingAthlete, {
            aAnnotation: 'New',
            bAnnotation: 'Existing',
          }))
          // console.log(diff(existingAthlete, partialMergedProfile))
        }
        updatedAthletes[athlete.uciId] = partialMergedProfile
      }
    } else {
      // console.log(`New athlete added with UCI ID: ${athlete.uciId}`)
      updatedAthletes[athlete.uciId] = athlete
    }
  }

  logger.info(`Saving athletes to: ${filename}`)

  try {
    await writeFile(filename, JSON.stringify(updatedAthletes))

    if (ENV === 'stage') fs.writeFileSync(`${LOCAL_STORAGE_PATH}/${filename}`, JSON.stringify(updatedAthletes, null, 2))
    logger.info(`${Object.keys(updatedAthletes).length} athletes saved successfully to: ${filename}`)
  } catch (error) {
    logger.error(`Failed to save athletes to ${filename}:`, (error as any).message)
  }

  await saveLookupFile(updatedAthletes)
}