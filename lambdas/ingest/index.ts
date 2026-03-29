import { APIGatewayProxyEventV2, Context, EventBridgeEvent, S3Event } from 'aws-lambda'
import { performance } from 'node:perf_hooks'
import { publishRaceEventChange } from '../shared/aws-sns'
import { CORS } from '../shared/config'
import data from '../shared/data.ts'
import { IngestEvent } from '../shared/types'
import { handler as CrossMgrParser } from './cross-mgr'

import { handler as ManualImportParser } from './manual'
import { getModifiedRefFiles } from './manual/utils.ts'
import { handler as WebscorerParser } from './webscorer'

const WATCH_HOURS = { morning: [9, 12], afternoon: [12, 17], evening: [17, 21], day: [9, 17] }

type RunOptions = {
  year: number
  eventHash?: string
  providers?: string[]
}

const HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': CORS.allowedMethods.join(','),
  'Access-Control-Allow-Headers': CORS.allowedHeaders.join(','),
  'Access-Control-Allow-Credentials': CORS.credentials,
  'Content-Type': 'application/json',
}

const isEventDayWatchHour = async () => {
  const eventDays = await data.get.eventDays()
  const today = new Date().toLocaleDateString('sv', { timeZone: 'America/Vancouver' })

  const currentHour = new Date().getHours()

  // No event today, skip high-frequency watcher
  if (!eventDays[today]) {
    console.log(`No event day found for ${today}`)
    return false
  }

  const eventDayWatchType = eventDays[today]

  // Outside event day watch hours, skip high-frequency watcher
  if (currentHour < WATCH_HOURS[eventDayWatchType][0] && currentHour > WATCH_HOURS[eventDayWatchType][1]) {
    console.log(`Outside watch hours: ${WATCH_HOURS[eventDayWatchType].join(':00-')}:00`)
    return false
  }

  return true
}

export const handler = async (event: EventBridgeEvent<any, any> | S3Event | APIGatewayProxyEventV2, _?: Context) => {
  let handlerResponses: Record<string, IngestEvent> = {}
  let watcher = null

  const start = performance.now()

  if (event && (event as S3Event).Records && (event as S3Event).Records.length > 0 && 's3' in (event as S3Event).Records[0]) {
    // Event day watcher
    watcher = 'S3-EVENT'
    console.log('Watcher', watcher)

    const modifiedRefFiles = getModifiedRefFiles(event as S3Event)
    console.log('Modified files:', modifiedRefFiles)

    if (!modifiedRefFiles.length) {
      console.log('No modified reference files found, skipping manual import')

      return {
        statusCode: 204,
        headers: HEADERS,
        body: JSON.stringify({ message: 'No modified reference files found' }),
        isBase64Encoded: false,
      }
    }

    // Call manual import parser
    handlerResponses['manual-import'] = await ManualImportParser({ importRefFiles: modifiedRefFiles })
  } else if ('rawPath' in event && event.rawPath) {
    // API Gateway event - extract options from query parameters

    const options: RunOptions = { year: new Date().getFullYear() }

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

      options.eventHash = eventHash
    } else {
      return {
        statusCode: 400,
        headers: HEADERS,
        body: JSON.stringify({ error: 'Invalid `runType` query parameter' }),
        isBase64Encoded: false,
      }
    }

    const providers = queryParams.providers ? queryParams.providers.split(',').map(provider => provider.trim()) : []
    if (providers.length > 0) options.providers = providers

    console.log('Run options:', options)

    if (!options.providers || options.providers.includes('cross-mgr')) {
      handlerResponses['cross-mgr'] = await CrossMgrParser(options)
    }
    if (!options.providers || options.providers.includes('webscorer')) {
      handlerResponses['webscorer'] = await WebscorerParser(options)
    }
    if (options.providers && options.providers.includes('manual-import')) {
      handlerResponses['manual-import'] = await ManualImportParser(options)
    }
  } else {
    // { resources: [ 'arn:aws:events:us-west-2:545296359752:rule/1-minute' ] }
    const eventBridgeRule = (event as EventBridgeEvent<any, any>).resources?.[0]

    if (eventBridgeRule?.endsWith('5-minutes')) {
      // Event day watcher
      watcher = 'EVENT-DAY'
      console.log('Watcher', watcher)

      const isWatchHourActive = await isEventDayWatchHour()

      if (isWatchHourActive) {
        handlerResponses['cross-mgr'] = await CrossMgrParser()
        handlerResponses['webscorer'] = await WebscorerParser()
      }
    } else if (eventBridgeRule?.endsWith('1-day')) {
    } else {
      // Hourly watcher
      watcher = 'HOURLY'
      console.log('Watcher', watcher)

      handlerResponses['cross-mgr'] = await CrossMgrParser()
      handlerResponses['webscorer'] = await WebscorerParser()
    }
  }

  console.log(handlerResponses)

  // Publish events for each parser response (if any)
  for (const [parserName, event] of Object.entries(handlerResponses)) {
    // Skip if no events to process (e.g. no new events found)
    if (!event.eventHashes.length && !event.seriesHashes.length) continue

    await publishRaceEventChange(event)
  }

  const end = performance.now()
  const durationMs = end - start

  return {
    statusCode: 200,
    headers: HEADERS,
    body: JSON.stringify({ durationMs, watcher, providers: handlerResponses }),
    isBase64Encoded: false,
  }
}