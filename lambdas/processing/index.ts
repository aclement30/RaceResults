import { APIGatewayProxyEventV2, Context, EventBridgeEvent, SNSEvent } from 'aws-lambda'
import { TeamParser } from '../shared/team-parser.ts'
import { performance } from 'node:perf_hooks'

// Steps
import { extractAthletes } from './athletes/extract'
import { cleanAthletes } from './athletes/clean.ts'
import { createAthleteLookupTable } from './athletes/create-lookup-table.ts'
import { extractRaceResults } from './race-results/extract'
import { cleanRaceResults } from './race-results/clean'
import { extractUpgradePoints } from './upgrade-points/extract.ts'
import { cleanUpgradePoints } from './upgrade-points/clean.ts'
import { processAthletesUpgradeDates } from './upgrade-dates/process.ts'
import { extractAthletesTeams } from './teams/extract'
import { cleanAthletesTeams } from './teams/clean.ts'
import { createViewAthletes } from './views/athletes.ts'
import { createViewAthleteProfiles } from './views/athlete-profiles.ts'
import { AthleteFinder } from '../shared/athlete-finder.ts'
import { createViewRecentlyUpgradedAthletes } from './views/recently-upgraded-athletes.ts'
import { CORS } from '../shared/config.ts'
import type { IngestEvent } from '../shared/types.ts'

type RunOptions = {
  year: number
  eventHashes?: string[]
  athleteUciIds: string[]
}

const HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': CORS.allowedMethods.join(','),
  'Access-Control-Allow-Headers': CORS.allowedHeaders.join(','),
  'Access-Control-Allow-Credentials': CORS.credentials,
  'Content-Type': 'application/json',
}

export const handler = async (event: EventBridgeEvent<any, any> | APIGatewayProxyEventV2 | SNSEvent, _?: Context) => {
  const options: RunOptions = { year: new Date().getFullYear(), athleteUciIds: [] }
  const start = performance.now()

  console.log({ event })

  // Check if the event is from EventBridge or API Gateway and extract options accordingly
  if ('rawPath' in event && (event as APIGatewayProxyEventV2).rawPath) {
    // API Gateway event - extract options from query parameters
    const queryParams = event.queryStringParameters || {}
    const year = queryParams.year ? parseInt(queryParams.year) : new Date().getFullYear()
    if (isNaN(year) || year < 2000 || year > new Date().getFullYear() + 1) {
      return {
        statusCode: 400,
        headers: HEADERS,
        body: JSON.stringify({ error: 'Invalid `year` query parameter' }),
        isBase64Encoded: false,
      }
    } else {
      options.year = year
    }

    const runType = queryParams.runType || 'all-events'
    if (runType === 'all-events') {
      // No additional parameters needed, will process all events for the year
    } else if (runType === 'event') {
      const eventHash = queryParams.eventHash
      if (!eventHash) {
        return {
          statusCode: 400,
          headers: HEADERS,
          body: JSON.stringify({ error: 'Missing `eventHash` query parameter for `event` runType' }),
          isBase64Encoded: false,
        }
      }

      options.eventHashes = [eventHash]
    } else if (runType === 'athletes') {
      const uciIdsString = queryParams.athleteUciIds
      const athleteUciIds = uciIdsString ? uciIdsString.split(',').map(id => id.trim()) : []
      if (athleteUciIds.length === 0) {
        return {
          statusCode: 400,
          headers: HEADERS,
          body: JSON.stringify({ error: 'Missing `athleteUciIds` query parameter for `athletes` runType' }),
          isBase64Encoded: false,
        }
      }

      // Validate UCI IDs format (basic validation, can be improved)
      if (athleteUciIds.some(id => !/^\d{11}$/.test(id))) {
        return {
          statusCode: 400,
          headers: HEADERS,
          body: JSON.stringify({ error: 'Each UCI ID must be 11 digits (separate by commas)' }),
          isBase64Encoded: false,
        }
      }

      options.athleteUciIds = athleteUciIds
    } else {
      return {
        statusCode: 400,
        headers: HEADERS,
        body: JSON.stringify({ error: 'Invalid `runType` query parameter' }),
        isBase64Encoded: false,
      }
    }
  } else if ('Records' in event && (event as SNSEvent).Records) {
    for (const record of event.Records) {
      try {
        const message: IngestEvent = JSON.parse(record.Sns.Message)
        const { year, eventHashes } = message

        console.log(`Processing SNS message ${record.Sns.MessageId}`)
        console.log({ record })

        options.year = year

        if (!options.eventHashes) options.eventHashes = []

        options.eventHashes = [...options.eventHashes, ...eventHashes]
      } catch (error) {
        console.error(`Failed to process SNS record:`, error)
        console.error({ record })
        // SNS will retry based on the subscription's retry policy
        throw error
      }
    }
  }

  console.log('Processing data with options:', JSON.stringify(options))

  await TeamParser.init()

  let updatedAthleteIds: string[] = []
  // Process athletes data first
  if (!options.athleteUciIds) {
    const { eventHashes: athleteEventHashes } = await extractAthletes(options)
    updatedAthleteIds = await cleanAthletes({ year: options.year, eventHashes: athleteEventHashes })
    await createAthleteLookupTable()
  } else {
    updatedAthleteIds = options.athleteUciIds
  }

  await AthleteFinder.init()

  // Process race results
  const { eventHashes: raceResultsEventHashes } = await extractRaceResults(options)
  const { athleteIds: updatedRaceAthleteIds } = await cleanRaceResults({
    year: options.year,
    eventHashes: raceResultsEventHashes
  })

  // Extract upgrade points after athletes data is cleaned
  await extractUpgradePoints({ year: options.year, eventHashes: raceResultsEventHashes })
  await cleanUpgradePoints({
    year: options.year,
    eventHashes: raceResultsEventHashes
  })

  const allUpdatedAthleteIds = options.athleteUciIds.length ? options.athleteUciIds : Array.from(new Set([
    ...updatedAthleteIds,
    ...updatedRaceAthleteIds
  ]))

  // Extract teams for updated athletes
  await extractAthletesTeams({ year: options.year, eventHashes: raceResultsEventHashes })
  await cleanAthletesTeams({ athleteIds: allUpdatedAthleteIds, year: options.year })

  // Process upgrade dates after athletes
  await processAthletesUpgradeDates({ athleteIds: allUpdatedAthleteIds })

  await createViewAthletes({ athleteIds: allUpdatedAthleteIds })

  // Unpack cleaned data for client-side usage
  await createViewAthleteProfiles({
    athleteIds: allUpdatedAthleteIds,
    year: options.year,
    eventHashes: raceResultsEventHashes
  })
  await createViewRecentlyUpgradedAthletes()

  const end = performance.now()
  const durationMs = end - start

  return {
    statusCode: 200,
    headers: HEADERS,
    body: JSON.stringify({
      options,
      allUpdatedAthleteIds,
      durationMs,
    }),
    isBase64Encoded: false,
  }
}
