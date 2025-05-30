import type { Context, EventBridgeEvent } from 'aws-lambda'
import { main as ManualImportParser } from '../parsers/manual-import/index.ts'
import { getEventDays } from '../parsers/shared/utils'
import { main as CrossMgrParser } from '../parsers/cross-mgr'

const WATCH_HOURS = { morning: [9, 12], afternoon: [12, 17], evening: [17, 21], day: [9, 17] }

export const handler = async (event: EventBridgeEvent<any, any>, _: Context) => {
  // { resources: [ 'arn:aws:events:us-west-2:545296359752:rule/1-minute' ] }
  const eventBridgeRule = event.resources?.[0]

  const results: Record<string, { events?: string, series?: string }> = {}
  let watcher = null

  if (eventBridgeRule?.endsWith('5-minutes')) {
    // Event day watcher
    watcher = 'EVENT-DAY'

    const eventDays = await getEventDays()
    const today = new Date().toLocaleDateString('sv')

    // const tomorrow = new Date()
    // tomorrow.setDate(tomorrow.getDate() + 1)
    // const today = tomorrow.toLocaleDateString('sv')

    const currentHour = new Date().getHours()

    // No event today, skip high-frequency watcher
    if (!eventDays[today]) {
      console.log(`No event day found for ${today}`)
      return
    }

    const eventDayWatchType = eventDays[today]

    // Outside event day watch hours, skip high-frequency watcher
    if (currentHour < WATCH_HOURS[eventDayWatchType][0] && currentHour > WATCH_HOURS[eventDayWatchType][1]) {
      console.log(`Outside watch hours: ${WATCH_HOURS[eventDayWatchType].join(':00-')}:00`)
      return
    }

    results['cross-mgr'] = await CrossMgrParser()
  } else if (eventBridgeRule?.endsWith('1-day')) {
    // Daily watcher
    watcher = 'DAILY'

    // @ts-ignore
    results['manual-import'] = await ManualImportParser()
  } else {
    // Hourly watcher
    watcher = 'HOURLY'

    results['cross-mgr'] = await CrossMgrParser()
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ watcher, results }),
  }
}