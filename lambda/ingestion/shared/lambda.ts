import { Context } from 'aws-lambda'
import { TEnv } from './config'
import { SNSMessageAttributes } from 'aws-lambda/trigger/sns'

export const getLambdaEnv = (context: Context): TEnv => {
  // Eg. `arn:aws:lambda:us-west-2:545296359752:function:test-lambda:STAGE`
  const { invokedFunctionArn } = context

  const arnParts = invokedFunctionArn.split(':')
  const lambdaEnv = arnParts[7]

  if (lambdaEnv === 'PROD') return 'prod'
  else return 'stage'
}

export const getLambdaOptionsFromSNSEvent = (event: PartialSNSEvent): Record<string, any> => {
  const { Sns: snsMessage } = event.Records[0]
  const { MessageAttributes: attributes } = snsMessage

  const options: Record<string, any> = {}

  if (attributes) {
    Object.keys(attributes).forEach(key => {
      options[key] = attributes[key].Type === 'String' ? attributes[key].Value : +attributes[key].Value
    })
  }

  return options
}

export const convertOptionsToSNSEvent = (options: Record<string, any>): PartialSNSEvent => {
  return {
    Records: [
      {
        Sns: {
          MessageAttributes: Object.entries(options).reduce((acc, [key, value]) => {
            acc[key] = {
              Type: typeof value === 'number' ? 'Number' : 'String',
              Value: String(value)
            }
            return acc
          }, {} as SNSMessageAttributes)
        }
      }
    ]
  }
}

export type PartialSNSEvent = { Records: Array<{ Sns: { MessageAttributes: SNSMessageAttributes } }> }
