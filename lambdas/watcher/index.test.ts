import type { EventBridgeEvent } from 'aws-lambda'
// @ts-ignore
import { handler } from './index.ts'

const WATCHER_TYPE: 'hourly' | 'event-day' | 'daily' | 's3-event' = 's3-event'

const s3Event = {
    'Records': [
      {
        'eventVersion': '2.1',
        'eventSource': 'aws:s3',
        'awsRegion': 'us-west-2',
        'eventTime': '2025-06-24T05:15:57.873Z',
        'eventName': 'ObjectCreated:Put',
        'userIdentity': {
          'principalId': 'A18X4LKS9JWLNT'
        },
        'requestParameters': {
          'sourceIPAddress': '75.155.139.47'
        },
        'responseElements': {
          'x-amz-request-id': 'RM4WRE83S1RMQR9A',
          'x-amz-id-2': 'rGUb7IHtT9P8/kXSk1rWprOEqejNtksm3tjUvL/917/jryQ6PHMgIstlrniVrMZA/Re6M4NhF9SdnOdLWNm1zt4I8QbVPRF+'
        },
        's3': {
          's3SchemaVersion': '1.0',
          'configurationId': 'f0bd9bb4-414a-47ba-bbeb-172119dd5baf',
          'bucket': {
            'name': 'cycling-race-results-stage',
            'ownerIdentity': {
              'principalId': 'A18X4LKS9JWLNT'
            },
            'arn': 'arn:aws:s3:::cycling-race-results-stage'
          },
          'object': {
            'key': 'data-ingestion/1-raw/manual-import/2025/CRC-Results.json',
            'size': 1499,
            'eTag': 'd5fc90553d809e2cb97e5ebec6aabead',
            'sequencer': '00685A348DD8870B8B'
          }
        }
      }
    ]
  }

;(async () => {
  if (WATCHER_TYPE === 'hourly') {
    await handler({ resources: ['1-hour'] } as EventBridgeEvent<any, any>)
  } else if (WATCHER_TYPE === 'event-day') {
    await handler({ resources: ['5-minutes'] } as EventBridgeEvent<any, any>)
  } else if (WATCHER_TYPE === 'daily') {
    await handler({ resources: ['1-day'] } as EventBridgeEvent<any, any>)
  } else if (WATCHER_TYPE === 's3-event') {
    await handler(s3Event, {} as any)
  }
})()
