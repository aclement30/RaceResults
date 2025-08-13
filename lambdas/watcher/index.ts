import type { Context, EventBridgeEvent, S3Event } from 'aws-lambda'
import { handler as ManualImportParser } from './manual'
import { handler as CrossMgrParser } from './cross-mgr'
import { handler as WebscorerParser } from './webscorer'
import { handler as AthletesParser } from './athletes'
import { getEventDays } from '../shared/utils.ts'
import { getModifiedRefFiles } from './manual/utils.ts'

const WATCH_HOURS = { morning: [9, 12], afternoon: [12, 17], evening: [17, 21], day: [9, 17] }

const isEventDayWatchHour = async () => {
  const eventDays = await getEventDays()
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

export const handler = async (event: EventBridgeEvent<any, any> | S3Event, _?: Context) => {
  let handlerResponses: Record<string, any> = {}
  let watcher = null

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
        body: JSON.stringify({ message: 'No modified reference files found' }),
      }
    }

    // Call manual import parser
    handlerResponses['manual-import'] = await ManualImportParser({ importRefFiles: modifiedRefFiles })
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
      // Daily watcher
      watcher = 'DAILY'
      console.log('Watcher', watcher)

      handlerResponses['athletes'] = await AthletesParser({ year: new Date().getFullYear() })
    } else {
      // Hourly watcher
      watcher = 'HOURLY'
      console.log('Watcher', watcher)

      handlerResponses['cross-mgr'] = await CrossMgrParser()
      handlerResponses['webscorer'] = await WebscorerParser()

      const isWatchHourActive = await isEventDayWatchHour()

      // During event days, refresh athletes data every hour
      if (isWatchHourActive) handlerResponses['athletes'] = await AthletesParser({ year: new Date().getFullYear() })
    }
  }

  console.log(handlerResponses)

  return handlerResponses
}