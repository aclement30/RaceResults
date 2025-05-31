import { handler } from './index.ts'

const WATCHER_TYPE = 'hourly'

;( async () => {
  if (WATCHER_TYPE === 'hourly') {
    await handler({ resources: ['1-hour'] } as any, {} as any)
  } else if (WATCHER_TYPE === 'event-day') {
    await handler({ resources: ['5-minutes'] } as any, {} as any)
  } else if (WATCHER_TYPE === 'daily') {
    await handler({ resources: ['1-day'] } as any, {} as any)
  }
} )()
