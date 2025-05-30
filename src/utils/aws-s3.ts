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

export async function fetchFile(filename: string, skipNotFound = false): Promise<string | false> {
  try {
    const response = await s3Client.send(
      new GetObjectCommand({
        Bucket: S3_BUCKET,
        Key: filename,
      }),
    )


    // The Body object also has 'transformToByteArray' and 'transformToWebStream' methods.
    const content = await response.Body?.transformToString() || ''

    return content
  } catch (error) {
    if (error instanceof S3ServiceException && error.name === 'NoSuchKey') {
      if (skipNotFound) return false

      throw new Error('No event found for this year!')
    }

    throw error
  }
}

export async function fetchEventYears(): Promise<number[]> {
  const { files } = await fetchDirectoryFiles('events/')

  const years = files?.map((file) => +getBasename(file.Key!).substring(0, 4)).sort().reverse() || []

  return years
}

export async function fetchEventsAndSeries(year: number) {
  let fileContents

  try {
    fileContents = await Promise.all([
      fetchFile(`events/${year}.json`),
      fetchFile(`series/${year}.json`, true),
    ])
  } catch (error) {
    if (error instanceof S3ServiceException && error.name === 'NoSuchKey') {
      throw new Error('No event found for this year!')
    }

    throw error
  }

  const events: EventSummary[] = !!fileContents[0] ? JSON.parse(fileContents[0]) : []
  const series: SerieSummary[] = !!fileContents[1] ? JSON.parse(fileContents[1]) : []


  return {
    events,
    series,
  }
}

export async function fetchEventResults(year: number, hash: string) {
  let content

  try {
    content = await fetchFile(`events-results/${year}/${hash}.json`)
  } catch (error) {
    if (error instanceof S3ServiceException && error.name === 'NoSuchKey') {
      throw new Error('No such event could be found!')
    }

    throw error
  }

  const eventResults: EventResults = content && JSON.parse(content)

  return eventResults
}

export async function fetchSeriesResults(year: number, hash: string) {
  let content

  try {
    content = await fetchFile(`series-results/${year}/${hash}.json`)
  } catch (error) {
    if (error instanceof S3ServiceException && error.name === 'NoSuchKey') {
      throw new Error('No such series could be found!')
    }

    throw error
  }

  const eventResults: SerieResults = content && JSON.parse(content)

  return eventResults
}