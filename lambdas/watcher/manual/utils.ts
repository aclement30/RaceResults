import type { S3Event } from 'aws-lambda'
import { startCase } from 'lodash-es'
import { capitalize, s3 as RRS3, validateYear } from '../../shared/utils.ts'
import type { ManualImportCategory } from './types.ts'
import { PROVIDER_NAME, RAW_DATA_PATH } from './config.ts'
import defaultLogger from '../../shared/logger.ts'
import { RR_S3_BUCKET } from '../../shared/config.ts'

const logger = defaultLogger.child({ provider: PROVIDER_NAME })

export const listRefFiles = async ({ year }: { year: number }): Promise<string[]> => {
  const { files } = await RRS3.fetchDirectoryFiles(RAW_DATA_PATH + year + '/')

  const refFiles = files?.filter(file => file.Key!.endsWith('.json')).map(file => file.Key!) || []

  logger.info(`Found ${refFiles.length} reference files in S3 bucket: ${RAW_DATA_PATH + year + '/'}`)

  return refFiles
}

export const validateRefFile = (data: any): boolean => {
  if (!data.organizer?.length) throw new Error('Missing reference field: organizer')
  if (!data.name?.length) throw new Error('Missing reference field: name')
  if (!data.year || !validateYear(data.year)) throw new Error('Missing/invalid reference field: year')
  if (!data.location) throw new Error('Missing reference field: location')
  if (!data.location.city?.length) throw new Error('Missing reference field: location.city')
  if (!data.location.province?.length) throw new Error('Missing reference field: location.province')
  if (!data.location.country?.length) throw new Error('Missing reference field: location.country')

  if (!data.type || !['event', 'serie'].includes(data.type)) throw new Error('Missing/invalid reference field: type')
  if (!data.lastUpdated) throw new Error('Missing reference field: lastUpdated')
  if (!data.provider && (!data.fields || Object.keys(data.fields).length === 0)) throw new Error('Missing/invalid reference field: fields or provider')
  if (data.type === 'event') {
    if (!data.provider && (!data.categories || !data.categories.length)) throw new Error('Missing/invalid reference field: categories')

    data.categories?.forEach((category: ManualImportCategory, index: number) => {
      if (!category.inputLabel?.length) throw new Error(`Missing reference field: categories.${index}.inputLabel`)
      if (!category.outputLabel?.length) throw new Error(`Missing reference field: categories.${index}.outputLabel`)
      if (!category.filename?.length) throw new Error(`Missing reference field: categories.${index}.filename`)
    })
  } else if (data.type === 'serie') {
    if (!data.categories || !Object.keys(data.categories).length) throw new Error('Missing/invalid reference field: categories')

    Object.keys(data.categories).forEach((key) => {
      if (!['individual', 'team'].includes(key)) throw new Error(`Invalid reference field: categories.${key}`)

      data.categories[key].forEach((category: ManualImportCategory, index: number) => {
        if (!category.inputLabel?.length) throw new Error(`Missing reference field: categories.${key}.${index}.inputLabel`)
        if (!category.outputLabel?.length) throw new Error(`Missing reference field: categories.${key}.${index}.outputLabel`)
        if (!category.filename?.length) throw new Error(`Missing reference field: categories.${key}.${index}.filename`)
      })
    })
  } else {
    throw new Error(`Unsupported reference file type: ${data.type}`)
  }

  return true
}

export const transformOrganizer = (organizerAlias: string): { organizerAlias: string, organizerName: string } => {
  if (organizerAlias === 'VictoriaCycling') {
    return {
      organizerAlias: 'VictoriaCycling',
      organizerName: 'Victoria Cycling League',
    }
  }

  return {
    organizerAlias,
    organizerName: startCase(organizerAlias),
  }
}

export const formatDurationToSeconds = (duration: string): number => {
  if (duration.match(/^\d+:\d+:\d+$/)) {
    const [hours, minutes, seconds] = duration.split(':').map(Number)
    return (hours * 3600) + (minutes * 60) + seconds
  } else if (duration.match(/^\+?\d+:\d+:\d+\.\d+$/)) {
    const [hours, minutes, seconds] = duration.split(':').map(Number)
    if (hours < 0) return -((Math.abs(hours) * 3600) + (minutes * 60) + seconds)
    return (hours * 3600) + (minutes * 60) + seconds
  } else if (duration.match(/^\+?\d+:\d+$/)) {
    const [minutes, seconds] = duration.split(':').map(Number)
    if (minutes < 0) return -((Math.abs(minutes) * 60) + Math.abs(seconds))
    return (minutes * 60) + seconds
  } else if (duration.match(/^\dh\d+['’]\d+"$/)) {
    const [hours, minutes, seconds] = duration.split(/h|'|’|"/).map(s => s.trim())
    return (+hours * 3600) + (+minutes * 60) + (+seconds)
  } else if (duration.match(/^\d+['’]\d+"$/)) {
    const [minutes, seconds] = duration.split(/'|’/).map(s => s.trim().replace('"', ''))
    return (+minutes * 60) + (+seconds)
  } else if (duration.match(/^\+?\d+:\d+\.\d+$/)) {
    const [minutes, seconds] = duration.split(':').map(Number)
    if (minutes < 0) return -((Math.abs(minutes) * 60) + Math.abs(seconds))
    return (minutes * 60) + seconds
  } else if (duration.match(/^\d+"$/)) {
    const seconds = duration.replace('"', '').trim()
    return +seconds
  } else {
    throw new Error(`Invalid duration format: ${duration}`)
  }
}

export const formatAthleteName = (str: { firstName: string, lastName: string } | { name: string }): {
  firstName: string,
  lastName: string
} => {
  let firstName
  let lastName

  if ('name' in str) {
    if (str.name.includes(',')) {
      [lastName, firstName] = str.name.split(',').map(s => capitalize(s.trim()))
    } else if (str.name.match(/^([A-Z-'\s]+)\s(.+)$/)) {
      [, lastName, firstName] = str.name.match(/^([A-Z-'\s]+)\s(.+)$/)!
      firstName = capitalize(firstName.trim())
      lastName = capitalize(lastName.trim())
    } else {
      throw new Error('Unrecognized athlete name format: ' + str.name)
    }
  } else if ('firstName' in str && 'lastName' in str) {
    firstName = capitalize(str.firstName)
    lastName = capitalize(str.lastName)
  } else {
    throw new Error('Invalid athlete name format (missing name or firstName/lastName): ' + JSON.stringify(str))
  }

  return {
    firstName,
    lastName,
  }
}

export const getModifiedRefFiles = (event: S3Event) => {
  // Check if the bucket match the expected one
  if (event.Records[0].s3.bucket.name !== RR_S3_BUCKET) return []

  const event2: S3Event = {
    Records: [
      {
        eventVersion: '2.0',
        eventSource: 'aws:s3',
        awsRegion: 'us-east-1',
        eventTime: '1970-01-01T00:00:00.000Z',
        eventName: 'ObjectCreated:Put',
        userIdentity: {
          'principalId': 'EXAMPLE'
        },
        requestParameters: {
          'sourceIPAddress': '127.0.0.1'
        },
        responseElements: {
          'x-amz-request-id': 'EXAMPLE123456789',
          'x-amz-id-2': 'EXAMPLE123/5678abcdefghijklambdaisawesome/mnopqrstuvwxyzABCDEFGH'
        },
        s3: {
          's3SchemaVersion': '1.0',
          'configurationId': 'testConfigRule',
          'bucket': {
            'name': 'example-bucket',
            'ownerIdentity': {
              'principalId': 'EXAMPLE'
            },
            'arn': 'arn:aws:s3:::example-bucket'
          },
          'object': {
            'key': 'test%2Fkey',
            'size': 1024,
            'eTag': '0123456789abcdef0123456789abcdef',
            'sequencer': '0A1B2C3D4E5F678901'
          }
        }
      }
    ]
  }

  const filteredFiles = event.Records
  .filter(({ s3 }) => {
    const key = s3.object.key
    const parts = key.split('/')
    const year = parts[parts.length - 2]

    return key.startsWith(RAW_DATA_PATH) && key.endsWith('.json') && validateYear(year)
  })

  return filteredFiles.map(({ s3 }) => s3.object.key)
}