import { PublishCommand, SNSClient } from '@aws-sdk/client-sns'
import { AWS_DEFAULT_CONFIG, AWS_RACE_EVENT_CHANGE_TOPIC_ARN, ENV } from './config.ts'
import type { IngestEvent, RaceEventChange } from './types.ts'

const sns = new SNSClient({ ...AWS_DEFAULT_CONFIG })

export const publishRaceEventChange = async (event: RaceEventChange) => {
  // Don't publish to SNS topic in dev environment
  if (ENV === 'dev') return

  // Publish to SNS topic
  const publishParams = {
    TopicArn: AWS_RACE_EVENT_CHANGE_TOPIC_ARN,
    Message: JSON.stringify({
      year: event.year,
      eventHashes: event.eventHashes,
    } as IngestEvent),
    Subject: 'data-ingest'
  }

  return sns.send(new PublishCommand(publishParams))
}