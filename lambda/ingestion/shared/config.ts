export const INGESTION_BASE_PATH = 'data-ingestion/'
export const ENV: 'prod' | 'stage' = process.env.ENV || 'stage'
export const RR_S3_BUCKET = ENV === 'prod' ? 'cycling-race-results' : 'cycling-race-results-stage'
export const AWS_DEFAULT_CONFIG = {
  region: 'us-west-2',
}
export const LOCAL_STORAGE_PATH = '../../storage'