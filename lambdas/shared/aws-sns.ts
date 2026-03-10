import { SNSClient, PublishCommand } from '@aws-sdk/client-sns'
import { AWS_DATA_INGEST_TOPIC_ARN, AWS_DEFAULT_CONFIG } from './config.ts'
import type { IngestEvent } from './types.ts'

const sns = new SNSClient({ ...AWS_DEFAULT_CONFIG })

export async function publishIngestEvent(event: IngestEvent) {
  // Publish to SNS topic
  const publishParams = {
    TopicArn: AWS_DATA_INGEST_TOPIC_ARN,
    Message: JSON.stringify({
      year: event.year,
      eventHashes: event.eventHashes,
      seriesHashes: event.seriesHashes,
      provider: event.provider,
    } as IngestEvent),
    Subject: 'data-ingest'
  }

  return sns.send(new PublishCommand(publishParams))
}