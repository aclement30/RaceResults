import { S3ServiceException } from '@aws-sdk/client-s3'
import defaultLogger from '../shared/logger.ts'
import { MEMBERSHIP_OUTPUT_PATH, SCRIPT_NAME } from './config.ts'
import type { AthleteLicense, AthleteMembershipData } from './types.ts'
import { fetchUciIdList, sleep, fetchRawMembershipFile } from './utils.ts'
import { s3 as RRS3 } from '../shared/utils.ts'

const logger = defaultLogger.child({ parser: SCRIPT_NAME })

const FETCH_ERROR_TYPE = {
  NoMembership: 'NoMembership',
  MultipleMemberships: 'MultipleMemberships',
  NoValidLicense: 'NoValidLicense',
  UnknownError: 'UnknownError',
} as const

class FetchError<const T> extends Error {
  type: T
  context?: any

  constructor(message: string, type: T, context?: any) {
    super(message)
    this.name = 'FetchError'
    this.type = type
    this.context = context
  }
}

const today = new Date().toLocaleDateString('sv', { timeZone: 'America/Vancouver' }).replace(/[-:]/g, '')

const queryMembership = async (uciId: string, year: number): Promise<AthleteMembershipData> => {
  const response = await fetch(`https://ccnbikes.com/en/rest/v2/membership_app/identity-memberships/lookup/?member_number=${uciId}&page=1&page_size=25&page_slug=cycling-bc-${year}`, {
    // headers: {
    //   // Customize request header here
    //   'Content-Type': 'application/json',
    //   // . . .
    // },
  })

  if (response.status === 200) {
    const data = await response.json()

    if (data.count === 0) {
      throw new FetchError(`No membership info found for UCI ID ${uciId}`, FETCH_ERROR_TYPE.NoMembership)
    } else if (data.count > 1) {
      throw new FetchError(`Multiple membership records found for UCI ID ${uciId}`, FETCH_ERROR_TYPE.MultipleMemberships)
    }

    const identitySnapshot = data.results[0]?.identity_snapshot!

    const athlete = {
      firstName: identitySnapshot.first_name,
      lastName: identitySnapshot.last_name,
      gender: identitySnapshot.gender,
      age: identitySnapshot.age,
    }

    const licenseGroups = data.results[0]?.lookup_identity_memberships[0]?.purchased_groups || []

    let licenses: AthleteLicense[] = []

    licenseGroups.forEach((group: any) => {
      const rawLicenses = group.nodes

      const parsedLicenses = rawLicenses.map((license: any) => {
        const text = license.name
        const parts = text.split(' :: ')
        if (text.startsWith('Road') || text.startsWith('Cyclocross')) {
          if (parts.length === 3) {
            return {
              year,
              text: license.name,
              discipline: parts[0].toUpperCase(),
              ageCategory: parts[1].toLowerCase(),
              level: parts[2].replace('Cat ', '').trim(),
            }
          } else if (parts.length === 4) {
            return {
              year,
              text: license.name,
              discipline: parts[0].toUpperCase(),
              ageGroup: parts[1].toLowerCase(),
              ageCategory: parts[2].toLowerCase().replace('Under ', '').trim(),
              level: parts[3].replace('Cat ', '').trim(),
            }
          }
        } else if (text.includes('UCI Cycling for All')) {
          return {
            year,
            text,
            discipline: 'ROAD',
            level: '5'
          }
          // } else {
          //   logger.warn(`Ignoring license with unsupported format: ${text}`, { uciId, text })
          //   return undefined
        }
      }).filter((l: AthleteLicense | undefined) => !!l)

      licenses = licenses.concat(parsedLicenses)
    })

    return {
      uciId,
      ...athlete,
      licenses,
    }
  } else {
    throw new FetchError(`Failed to query membership data for UCI ID ${uciId}: HTTP ${response.status}`, FETCH_ERROR_TYPE.UnknownError, {
      uciId,
      response
    })
  }
}

export const importRawData = async (options?: { year?: number, outputFile?: string }) => {
  if (!options) options = {}
  if (!options.year) options.year = new Date().getFullYear()

  let outputFilePath = MEMBERSHIP_OUTPUT_PATH + (options.outputFile ? options.outputFile : `${today}.json`)

  const uciIdList = await fetchUciIdList()
  let partialMembershipDataFromEarlierToday: Record<string, AthleteMembershipData | null> = {}

  try {
    logger.info(`Loading partial membership data from: ${outputFilePath}`)

    partialMembershipDataFromEarlierToday = await fetchRawMembershipFile(outputFilePath)
  } catch (error) {
    if (error instanceof S3ServiceException && error.name === 'NoSuchKey') {
      logger.info(`No existing data file found: ${outputFilePath}`)
    } else {
      throw error
    }
  }

  if (Object.keys(partialMembershipDataFromEarlierToday).length) logger.info(`Skipping ${Object.keys(partialMembershipDataFromEarlierToday).length} completed UCI IDs in previous file: ${outputFilePath}`)

  const results: Record<string, AthleteMembershipData | null> = partialMembershipDataFromEarlierToday

  // Skip if UCI ID has already been queried for the requested year
  const uciIdListFiltered = uciIdList.filter(uciId => !Object.keys(partialMembershipDataFromEarlierToday).includes(uciId))

  const totalQueries = uciIdListFiltered.length

  for (const [index, uciId] of uciIdListFiltered.entries()) {
    logger.info(`${(index + 1)}/${totalQueries} - Querying ${options.year} membership for UCI ID: ${uciId}`)

    let result: AthleteMembershipData | null = null

    try {
      result = await queryMembership(uciId, options.year)
      results[result.uciId] = result
    } catch (error) {
      if (error instanceof FetchError) {
        switch (error.type) {
          case FETCH_ERROR_TYPE.NoMembership:
            logger.warn(error.message, { uciId })
            break
          case FETCH_ERROR_TYPE.MultipleMemberships:
            logger.warn(error.message, { uciId })
            break
          case FETCH_ERROR_TYPE.NoValidLicense:
            logger.warn(error.message, { uciId })
            break
          case FETCH_ERROR_TYPE.UnknownError:
            logger.error(error.message, error.context)
            break
        }

        results[uciId] = null
      } else {
        logger.error((error as any).message, { uciId, error })
      }
    }

    try {
      // Save partial results every 10 requests to avoid losing too much data in case of failure
      if (index % 10 === 0) {
        logger.info(`Saving partial membership data for ${Object.keys(results).length} athletes to: ${outputFilePath}`)
        await RRS3.writeFile(outputFilePath, JSON.stringify(results, null, 2))
      }
    } catch (error) {
      logger.error(`Failed to save membership data: ${(error as Error).message}`, { error })
    }

    await sleep(200)
  }

  logger.info(`Saving membership data for ${Object.keys(results).length} athletes to: ${outputFilePath}`)
  try {
    await RRS3.writeFile(outputFilePath, JSON.stringify(results, null, 2))
  } catch (error) {
    logger.error(`Failed to save membership data: ${(error as Error).message}`, { error })
  }

  return {
    outputFile: outputFilePath,
    totalQueries,
    totalMemberships: Object.keys(results).length,
  }
}
