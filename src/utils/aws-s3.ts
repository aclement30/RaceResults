import {
  S3Client,
  ListObjectsCommand,
  type ListObjectsCommandOutput,
  GetObjectCommand,
  S3ServiceException
} from '@aws-sdk/client-s3'
import { fromCognitoIdentityPool } from '@aws-sdk/credential-providers'
import type { EventResults, EventSummary, SerieResults, SerieSummary } from '../types/results'

const S3_BUCKET = 'cycling-race-results'
const AWS_REGION = 'us-west-2'
const AWS_POOL_ID = 'us-west-2:d4056c4b-05d2-4f3f-930c-ba3e95cb2153'

const s3Client = new S3Client({
  region: AWS_REGION, credentials: fromCognitoIdentityPool({
    clientConfig: { region: AWS_REGION },
    identityPoolId: AWS_POOL_ID,
  }),
})

type AwsFiles = Required<ListObjectsCommandOutput['Contents']>

function getBasename(filename: string) {
  return filename.split('/').pop()!
}

export function validateYear(year: string | number) {
  if (isNaN(+year)) return false

  return +year >= 2020 && +year <= new Date().getFullYear()
}

export const FETCH_ERROR_TYPE = {
  NotFound: 'NotFound',
  NotModified: 'NotModified',
  Unknown: 'Unknown',
} as const

export class FetchError<const T> extends Error {
  type: T

  constructor(message: string, type: T) {
    super(message)
    this.name = 'FetchError'
    this.type = type
  }
}

export async function fetchDirectoryFiles(directory: string): Promise<{ files: AwsFiles, subdirectories: string[] }> {
  const response = await s3Client.send(
    new ListObjectsCommand({
      Bucket: S3_BUCKET,
      Delimiter: '/',
      Prefix: directory,
    })
  )

  let files: AwsFiles = []
  let subdirectories: string[] = []

  if (response.Contents?.length) files = response.Contents
  if (response.CommonPrefixes) subdirectories = response.CommonPrefixes.map(({ Prefix }) => Prefix!)

  return {
    files,
    subdirectories,
  }
}

type FetchFileOptions = {
  ifModifiedSince?: Date | null
}

export async function fetchFile(filename: string, options?: FetchFileOptions): Promise<{
  content: string,
  lastModified: Date
}> {
  try {
    const response = await s3Client.send(
      new GetObjectCommand({
        Bucket: S3_BUCKET,
        Key: filename,
        IfModifiedSince: options?.ifModifiedSince || undefined,
      }),
    )

    // The Body object also has 'transformToByteArray' and 'transformToWebStream' methods.
    const content = await response.Body?.transformToString() || ''

    return { content, lastModified: response.LastModified! }
  } catch (error) {
    if (error instanceof S3ServiceException && error.$response?.statusCode === 304) {
      throw new FetchError(`File not modified: ${filename}`, FETCH_ERROR_TYPE.NotModified)
    } else if (error instanceof S3ServiceException && error.name === 'NoSuchKey') {
      throw new FetchError(`File not found: ${filename}`, FETCH_ERROR_TYPE.NotFound)
    }

    throw error
  }
}

export async function fetchEventYears(): Promise<number[]> {
  const { files } = await fetchDirectoryFiles('events/')

  const years = files?.map((file) => +getBasename(file.Key!).substring(0, 4)).sort().reverse() || []

  return years
}

export async function fetchEvents(year: number, ifModifiedSince?: Date | null) {
  let response

  try {
    response = await fetchFile(`events/${year}.json`, { ifModifiedSince })
  } catch (error) {
    // If the file is not found, return an empty array
    if (error instanceof FetchError && error.type === FETCH_ERROR_TYPE.NotFound) {
      return { events: [] as EventSummary[], lastModified: new Date() }
    }

    throw error
  }

  const events: EventSummary[] = JSON.parse(response.content)

  return { events, lastModified: response.lastModified }
}

export async function fetchEventResults(year: number, hash: string, ifModifiedSince?: Date | null) {
  let response

  try {
    response = await fetchFile(`events-results/${year}/${hash}.json`, { ifModifiedSince })
  } catch (error) {
    if (error instanceof S3ServiceException && error.name === 'NoSuchKey') {
      throw new Error('No such event could be found!')
    }

    throw error
  }

  const eventResults: EventResults = response && response.content && JSON.parse(response.content)

  return { eventResults, lastModified: response.lastModified }
}

export async function fetchSeries(year: number, ifModifiedSince?: Date | null) {
  let response

  try {
    response = await fetchFile(`series/${year}.json`, { ifModifiedSince })
  } catch (error) {
    // If the file is not found, return an empty array
    if (error instanceof FetchError && error.type === FETCH_ERROR_TYPE.NotFound) {
      return { series: [] as EventSummary[], lastModified: new Date() }
    }

    throw error
  }

  const series: SerieSummary[] = JSON.parse(response.content)

  return { series, lastModified: response.lastModified }
}

export async function fetchSeriesResults(year: number, hash: string, ifModifiedSince?: Date | null) {
  let response

  try {
    response = await fetchFile(`series-results/${year}/${hash}.json`, { ifModifiedSince })
  } catch (error) {
    if (error instanceof S3ServiceException && error.name === 'NoSuchKey') {
      throw new Error('No such series could be found!')
    }

    throw error
  }

  const serieResults: SerieResults = response && response.content && JSON.parse(response.content)

  return { serieResults, lastModified: response.lastModified }
}