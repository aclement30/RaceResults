import { PUBLIC_BUCKET_FILES, PUBLIC_BUCKET_PATHS } from '../../../src/config/s3.ts'

const Environment = {
  prod: 'prod',
  stage: 'stage',
  dev: 'dev',
} as const

export type TEnv = typeof Environment[keyof typeof Environment];

export const INGESTION_BASE_PATH = 'data-ingestion/'

const CONFIG_BASE_PATH = `${INGESTION_BASE_PATH}config/`
export const CONFIG_FILES = {
  athletesOverrides: `${CONFIG_BASE_PATH}athletes-overrides.json`,
  eventDays: `${CONFIG_BASE_PATH}event-days.json`,
}

export const WATCHERS_PATH = `${INGESTION_BASE_PATH}watchers/`
export const ENV: TEnv = process.env.ENV as TEnv || 'dev'

export const DEBUG = process.env.DEBUG === 'true' || true

export const RR_S3_BUCKET = ENV === 'prod' ? 'cycling-race-results' : 'cycling-race-results-stage'
export const AWS_DEFAULT_CONFIG = {
  region: 'us-west-2',
}
export const LOCAL_STORAGE_PATH = '../../storage'

const currentYear = new Date().getFullYear()

export const NO_CACHE_FILES = [
  PUBLIC_BUCKET_FILES.athletes.list,
  `${PUBLIC_BUCKET_PATHS.athletesProfiles}list.json`,
  `${PUBLIC_BUCKET_PATHS.events}${currentYear}.json`,
  `${PUBLIC_BUCKET_PATHS.eventsResults}${currentYear}`,
]
