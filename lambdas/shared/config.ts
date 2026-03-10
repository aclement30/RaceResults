import { PUBLIC_BUCKET_FILES, PUBLIC_BUCKET_PATHS } from '../../src/config/s3.ts'

const Environment = {
  prod: 'prod',
  stage: 'stage',
  dev: 'dev',
} as const

export type TEnv = typeof Environment[keyof typeof Environment];

export const RAW_INGESTION_DATA_PATH = 'raw_ingestion_data/'

export const CONFIG_FILES = {
  athletesOverrides: 'athlete_overrides.json',
  eventDays: 'event_days.json',
}

export const WATCHER_LAST_CHECKS_PATH = `watcher_last_checks/`

export const ENV: TEnv = process.env.ENV as TEnv || 'dev'

export const DEBUG = process.env.DEBUG === 'true' || true

export const RR_S3_BUCKET = ENV === 'prod' ? 'cycling-race-results' : 'cycling-race-results-stage'
export const AWS_DEFAULT_CONFIG = {
  region: 'us-west-2',
}
export const LOCAL_STORAGE_PATH = process.env.LOCAL_STORAGE_PATH || '../../storage'

const currentYear = new Date().getFullYear()

export const NO_CACHE_FILES = [
  PUBLIC_BUCKET_FILES.athletes.list,
  PUBLIC_BUCKET_PATHS.athletesProfiles,
  `${PUBLIC_BUCKET_PATHS.events}${currentYear}.json`,
  `${PUBLIC_BUCKET_PATHS.eventsResults}${currentYear}`,
]

export const CLEAN_ATHLETE_CATEGORIES_FILE = 'athletes_skill_categories.json'

export const CORS = {
  allowedOrigins: [
    'http://localhost:5173',
    'https://race-results.aclement.com',
  ],
  allowedMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}

export const AWS_DATA_INGEST_TOPIC_ARN = `arn:aws:sns:us-west-2:545296359752:race-results-data-ingest-${ENV === 'prod' ? 'prod' : 'stage'}`