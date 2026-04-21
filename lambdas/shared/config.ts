import { config as dotEnvConfig } from 'dotenv'
import { PUBLIC_BUCKET_FILES, PUBLIC_BUCKET_PATHS } from '../../src/config/s3.ts'

dotEnvConfig({ path: '../.env.local' })

const Environment = {
  prod: 'prod',
  stage: 'stage',
  dev: 'dev',
} as const

export type TEnv = typeof Environment[keyof typeof Environment];

export const ENV: TEnv = process.env.ENV as TEnv || 'dev'

export const DEBUG = process.env.DEBUG === 'true' || true

// AWS
export const AWS_DEFAULT_CONFIG = {
  region: 'us-west-2',
}

// S3
export const RR_S3_BUCKET = ENV === 'prod' ? 'cycling-race-results' : 'cycling-race-results-stage'

export const DRAFT_EVENTS_PATH = 'draft_events/'
export const EVENTS_RESULTS_SNAPSHOTS_PATH = 'events_results_snapshots/'
export const DRAFT_SERIES_STANDINGS_PATH = 'draft_series_standings/'
export const SERIES_STANDINGS_SNAPSHOTS_PATH = 'series_standings_snapshots/'
export const RAW_INGESTION_DATA_PATH = 'raw_ingestion_data/'
export const RULES_PATH = 'rules/'
export const WATCHER_LAST_CHECKS_PATH = `watcher_last_checks/`

export const CLEAN_ATHLETE_CATEGORIES_FILE = 'athletes_skill_categories.json'
export const CONFIG_FILES = {
  athletesOverrides: 'athlete_overrides.json',
  eventDays: 'event_days.json',
}

// Local storage (for local development and testing)
export const LOCAL_STORAGE_PATH = process.env.LOCAL_STORAGE_PATH || '../../storage'

// Caching
const currentYear = new Date().getFullYear()
export const NO_CACHE_FILES = [
  PUBLIC_BUCKET_FILES.athletes.list,
  PUBLIC_BUCKET_PATHS.athletesProfiles,
  `${PUBLIC_BUCKET_PATHS.events}${currentYear}.json`,
  `${PUBLIC_BUCKET_PATHS.eventsResults}${currentYear}`,
]

// CORS configuration for API Gateway
export const CORS = {
  allowedOrigins: [
    'http://localhost:5173',
    'https://race-results.aclement.com',
  ],
  allowedMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}

// SNS
export const AWS_RACE_EVENT_CHANGE_TOPIC_ARN = process.env.AWS_RACE_EVENT_CHANGE_TOPIC_ARN