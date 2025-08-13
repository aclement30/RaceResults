import {
  S3Client,
  ListObjectsCommand,
  type ListObjectsCommandOutput,
  GetObjectCommand,
  S3ServiceException
} from '@aws-sdk/client-s3'
import { fromCognitoIdentityPool } from '@aws-sdk/credential-providers'
import type { EventResults, EventSummary, SerieResults, SerieSummary } from '../types/results'
import type { Athlete, AthleteCompilations, AthleteProfile } from '../types/athletes'
import { PUBLIC_BUCKET_FILES, PUBLIC_BUCKET_PATHS } from '../config/s3'
import type { Team } from '../types/team'

const { VITE_AWS_REGION, VITE_AWS_POOL_ID, VITE_RR_S3_BUCKET } = import.meta.env || {}

const s3Client = new S3Client({
  region: VITE_AWS_REGION,
  credentials: fromCognitoIdentityPool({
    clientConfig: { region: VITE_AWS_REGION },
    identityPoolId: VITE_AWS_POOL_ID,
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
      Bucket: VITE_RR_S3_BUCKET,
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
        Bucket: VITE_RR_S3_BUCKET,
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
  const { files } = await fetchDirectoryFiles(PUBLIC_BUCKET_PATHS.events)

  const years = files?.map((file) => +getBasename(file.Key!).substring(0, 4)).sort().reverse() || []

  return years
}

export async function fetchEvents(year: number, ifModifiedSince?: Date | null) {
  let response

  try {
    response = await fetchFile(`${PUBLIC_BUCKET_PATHS.events}${year}.json`, { ifModifiedSince })
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
    response = await fetchFile(`${PUBLIC_BUCKET_PATHS.eventsResults}${year}/${hash}.json`, { ifModifiedSince })
  } catch (error) {
    if (error instanceof FetchError && error.type === FETCH_ERROR_TYPE.NotFound) {
      throw new FetchError('The requested event could not be found!', error.type)
    }

    throw error
  }

  const eventResults: EventResults = response && response.content && JSON.parse(response.content)

  return { eventResults, lastModified: response.lastModified }
}

export async function fetchSeries(year: number, ifModifiedSince?: Date | null) {
  let response

  try {
    response = await fetchFile(`${PUBLIC_BUCKET_PATHS.series}${year}.json`, { ifModifiedSince })
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
    response = await fetchFile(`${PUBLIC_BUCKET_PATHS.seriesResults}${year}/${hash}.json`, { ifModifiedSince })
  } catch (error) {
    if (error instanceof FetchError && error.type === FETCH_ERROR_TYPE.NotFound) {
      throw new FetchError('The requested series could not be found!', error.type)
    }

    throw error
  }

  const serieResults: SerieResults = response && response.content && JSON.parse(response.content)

  return { serieResults, lastModified: response.lastModified }
}

export async function fetchTeamsList(): Promise<Record<string, Team>> {
  let response

  try {
    response = await fetchFile(PUBLIC_BUCKET_FILES.athletes.teams)
  } catch (error) {
    // If the file is not found, return an empty array
    if (error instanceof FetchError && error.type === FETCH_ERROR_TYPE.NotFound) {
      return {}
    }

    throw error
  }

  return JSON.parse(response.content) as Record<string, Team>
}

export async function fetchAthletesList(): Promise<Record<string, Athlete>> {
  let response

  try {
    response = await fetchFile(PUBLIC_BUCKET_FILES.athletes.list)
  } catch (error) {
    // If the file is not found, return an empty array
    if (error instanceof FetchError && error.type === FETCH_ERROR_TYPE.NotFound) {
      return {}
    }

    throw error
  }

  return JSON.parse(response.content) as Record<string, Athlete>
}

export async function fetchAthleteLookupTable(): Promise<Record<string, string>> {
  let response

  try {
    response = await fetchFile(PUBLIC_BUCKET_FILES.athletes.lookup)
  } catch (error) {
    // If the file is not found, return an empty array
    if (error instanceof FetchError && error.type === FETCH_ERROR_TYPE.NotFound) {
      return {}
    }

    throw error
  }

  return JSON.parse(response.content) as Record<string, string>
}

export async function fetchAthleteProfile(uciId: string): Promise<AthleteProfile> {
  let response

  try {
    response = await fetchFile(`${PUBLIC_BUCKET_PATHS.athletesProfiles}${uciId}.json`)
  } catch (error) {
    // If the file is not found, return an empty array
    if (error instanceof FetchError && error.type === FETCH_ERROR_TYPE.NotFound) {
      throw new FetchError('Athlete profile could not be found!', error.type)
    }

    throw error
  }

  return JSON.parse(response.content) as AthleteProfile
}

export async function fetchAthleteCompilations(): Promise<AthleteCompilations> {
  let response

  try {
    response = await fetchFile(PUBLIC_BUCKET_FILES.athletes.compilations)
  } catch (error) {
    // If the file is not found, return an empty array
    if (error instanceof FetchError && error.type === FETCH_ERROR_TYPE.NotFound) {
      throw new Error('Athlete compilations could not be found!')
    }

    throw error
  }

  return JSON.parse(response.content) as AthleteCompilations
}