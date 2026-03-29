import type { APIGatewayProxyEventV2 } from 'aws-lambda'
import { DynamoDBClient, UpdateItemCommand } from '@aws-sdk/client-dynamodb'
import { marshall } from '@aws-sdk/util-dynamodb'
import { randomUUID } from 'crypto'
import { FEEDBACK_TABLE } from '../config.ts'
import { AWS_DEFAULT_CONFIG } from '../../shared/config.ts'

const dynamoClient = new DynamoDBClient({
  ...AWS_DEFAULT_CONFIG
})

const upsert = (item: Record<string, any>, tableName: string, pk: string = 'id', fields: string[]) => {
  const params = {
    TableName: tableName,
    UpdateExpression: `SET ${fields.map((k, index) => `#field${index} = :value${index}`).join(', ')}`,
    ExpressionAttributeNames: fields.reduce((accumulator, k, index) => ({
      ...accumulator,
      [`#field${index}`]: k
    }), {}),
    ExpressionAttributeValues: fields.reduce((accumulator, k, index) => ({
      ...accumulator,
      [`:value${index}`]: marshall(item[k])
    }), {}),
    Key: {
      [pk]: marshall(item[pk])
    },
  }

  return dynamoClient.send(new UpdateItemCommand(params))
}

export const FeedbackRoute = async (event: APIGatewayProxyEventV2) => {
  // Extract feedback from the request body
  const body = JSON.parse(event.body || '{}')
  const { id: existingId, url, feedbackType, comments } = body

  if (!url || !feedbackType) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Invalid input. Please provide `url`, `feedbackType`.' }),
      headers: { 'Content-Type': 'application/json' }
    }
  }

  // Generate a unique ID for the feedback entry using md5 hash of URL and timestamp
  const id = existingId || randomUUID()

  const feedback = {
    id,
    url,
    feedbackType,
    comments: comments || null,
    timestamp: new Date().toISOString(),
  }

  await upsert(feedback, FEEDBACK_TABLE, 'id', ['feedbackType', 'comments', 'timestamp'])

  return {
    statusCode: 201,
    body: JSON.stringify({ id }),
  }
}