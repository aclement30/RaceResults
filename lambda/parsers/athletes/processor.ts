import fs from 'fs'
import type { EventAthlete, EventResults } from '../../../src/types/results.ts'
import defaultLogger from 'ingestion/shared/logger.ts'
import _ from 'lodash'
import { diff as consoleDiff } from 'jest-diff'
import { S3ServiceException } from '@aws-sdk/client-s3'
import { deleteFile, fetchFile, loadOverrides, writeFile } from './aws-s3.ts'
import { diff } from 'deep-object-diff'
import type { AthleteOverrides, StoredEventSummary } from './types.ts'
import type { Athlete } from '../../../src/types/athletes.ts'
import { ENV, LOCAL_STORAGE_PATH } from 'ingestion/shared/config.ts'
import { capitalize, formatProvince, formatTeamName } from 'ingestion/shared/utils.ts'

const logger = defaultLogger.child({ provider: 'athletes' })

export const processEventResults = async (storedEventFiles: StoredEventSummary[], year: number) => {
  const athleteOverrides = await loadOverrides()

  const extractResults = await Promise.allSettled(storedEventFiles.map(async ({ resultsFile, date }) => {
    const eventResults = await loadEventResults(resultsFile)

    const extractedEventAthletes = await extractEventAthletes(eventResults.athletes, date, athleteOverrides)

    logger.info(`${date}: ${Object.keys(extractedEventAthletes).length || 0} athletes found`)

    return extractedEventAthletes
  }))

  let combinedEventAthletes: Athlete[] = []

  extractResults.forEach((parseResult) => {
    if (parseResult.status === 'fulfilled') {
      combinedEventAthletes = combinedEventAthletes.concat(parseResult.value)
    } else {
      logger.error(`Error while processing event athletes: ${parseResult.reason}`)
    }
  })

  logger.info(`Total non-unique athletes extracted: ${combinedEventAthletes.length}`)

  // Delete existing athletes data
  // await deleteFile(`athletes/data.json`)

  const extractedFilename = `athletes/extracted.json`
  if (ENV === 'stage') fs.writeFileSync(`${LOCAL_STORAGE_PATH}/${extractedFilename}`, JSON.stringify(combinedEventAthletes, null, 2))

  try {
    await saveAthletes(combinedEventAthletes, year)
  } catch (error) {
    console.trace(error)
    logger.error(`Failed to save athletes: ${(error as Error).message}`)
  }
}

export async function extractEventAthletes(eventAthletes: Record<string, EventAthlete>, date: string, overrides: AthleteOverrides): Promise<Athlete[]> {
  const allAthletes: Record<string, Athlete> = {}
  const year = +date.substring(0, 4)

  Object.values(eventAthletes).forEach((eventAthlete) => {
    const { firstName, lastName, gender, city, state, license, age, team } = eventAthlete
    let { uciId } = eventAthlete

    if (!uciId) {
      // logger.warn(`Athlete ${firstName} ${lastName} has no UCI ID for event (${date}), skipping`)
      return
    }

    if (!uciId.match(/^\d{11}$/)) {
      logger.warn(`Invalid UCI ID format for athlete: ${uciId} (${firstName} ${lastName}), skipping`)
      return
    }

    if (overrides?.replacedUciIds?.[uciId]) {
      const newUciId = overrides.replacedUciIds[uciId].new
      logger.info(`Replaced UCI ID ${uciId} -> ${newUciId} for athlete: ${firstName} ${lastName}`)
      uciId = newUciId
    }

    // if (overrides?.deactivatedUciIds?.includes(uciId)) {
    //   logger.warn(`Deactivated UCI ID ${uciId} for athlete ${firstName} ${lastName}, skipping`)
    //   return
    // }

    if (allAthletes[uciId]) {
      logger.warn(`Duplicate athlete found: ${firstName} ${lastName} with UCI ID ${uciId}, skipping`)
      return
    }

    allAthletes[uciId] = {
      uciId,
      firstName: capitalize(firstName) || null,
      lastName: capitalize(lastName) || null,
      gender: gender || 'X',
      city: capitalize(city) || null,
      province: state ? formatProvince(state) : null,
      birthYear: age ? year - age : new Date().getFullYear(),
      licenses: license && license.toUpperCase() !== 'TEMP' ? { [year]: [license.toUpperCase().trim()] } : {},
      teams: {
        [year]: team && formatTeamName(team) !== 'Independent' ? [formatTeamName(team)] : []
      },
      lastUpdated: date
    }
  })

  return Object.values(allAthletes)
}

export async function saveAthletes(athletes: Athlete[], year: number): Promise<void> {
  const filename = `athletes/data.json`

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

async function saveLookupFile(data: Record<string, Athlete>): Promise<void> {
  const lookupFilename = `athletes/lookup.json`
  const duplicatesFilename = `athletes/duplicates.json`

  const duplicates: Record<string, string> = {}

  const lookupTable = Object.keys(data).reduce((acc, uciId) => {
    const athlete = data[uciId]
    const key = `${athlete.firstName || ''}|${athlete.lastName || ''}`.trim()

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

  logger.info(`Saving lookup table to: ${lookupFilename}`)

  try {
    await writeFile(lookupFilename, JSON.stringify(lookupTable))
    await writeFile(duplicatesFilename, JSON.stringify(duplicates))

    if (ENV === 'stage') fs.writeFileSync(`${LOCAL_STORAGE_PATH}/${lookupFilename}`, JSON.stringify(lookupTable, null, 2))
    if (ENV === 'stage') fs.writeFileSync(`${LOCAL_STORAGE_PATH}/${duplicatesFilename}`, JSON.stringify(duplicates, null, 2))
    logger.info(`${Object.keys(lookupTable).length} athletes saved successfully to: ${lookupFilename}`)
    if (Object.keys(duplicates).length > 0) logger.info(`${Object.keys(duplicates).length} duplicates saved to: ${duplicatesFilename}`)
  } catch (error) {
    logger.error(`Failed to save athletes to ${lookupFilename}:`, (error as any).message)
  }
}

function reconcileAthleteProfiles(existingProfile: Athlete, newProfile: Athlete, year: number): Athlete {
  const mergedProfile: Athlete = _.cloneDeep(existingProfile)

  Object.keys(newProfile).forEach((key) => {
    if (['licenses', 'teams', 'lastUpdated'].includes(key)) return // Skip licenses and teams, handled separately

    // @ts-ignore
    if (existingProfile[key] === null && !!newProfile[key]) mergedProfile[key] = newProfile[key]
    else { // @ts-ignore
      if (existingProfile[key] !== newProfile[key] && newProfile[key] !== null && newProfile.lastUpdated > existingProfile.lastUpdated) {
        // @ts-ignore
        mergedProfile[key] = newProfile[key]
      }
    }
  })

  if (newProfile.licenses[year]) {
    for (const license of newProfile.licenses[year]) {
      if (!existingProfile.licenses[year]?.includes(license)) {
        if (!mergedProfile.licenses[year]) mergedProfile.licenses[year] = []
        mergedProfile.licenses[year].push(license)
      }
    }
  }

  if (newProfile.teams[year]) {
    for (const team of newProfile.teams[year]) {
      if (team !== 'Independent' && !existingProfile.teams[year]?.includes(team)) {
        if (!mergedProfile.teams[year]) mergedProfile.teams[year] = []
        mergedProfile.teams[year].push(team)
      }
    }
  }

  // Remove 'Independent' if there are other teams for the same year
  if (mergedProfile.teams[year]?.length > 1 && mergedProfile.teams[year].includes('Independent')) {
    mergedProfile.teams[year] = mergedProfile.teams[year].filter(t => t !== 'Independent')
  }

  if (newProfile.lastUpdated > existingProfile.lastUpdated) mergedProfile.lastUpdated = newProfile.lastUpdated

  return mergedProfile
}

export async function loadEventResults(filename: string): Promise<EventResults> {
  logger.info(`Importing event results for: ${filename}`)

  const fileContent = await fetchFile(filename)

  if (!fileContent) throw new Error(`File ${filename} not found!`)

  return JSON.parse(fileContent) as EventResults
}

export async function loadAthleteRegistry(filename: string): Promise<Record<string, Athlete>> {
  try {
    logger.info(`Loading athlete registry from: ${filename}`)
    const fileContent = await fetchFile(filename)

    if (!fileContent) return {}

    const athletes: Record<string, Athlete> = JSON.parse(fileContent)

    return athletes
  } catch (error) {
    if (error instanceof S3ServiceException && error.name === 'NoSuchKey') {
      return {}
    }

    throw error
  }
}

