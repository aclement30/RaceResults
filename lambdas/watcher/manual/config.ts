import { INGESTION_BASE_PATH } from '../../shared/config.ts'

export const PROVIDER_NAME = 'manual-import'
export const RAW_DATA_PATH = `${INGESTION_BASE_PATH}1-raw/${PROVIDER_NAME}/`
export const CLEAN_DATA_PATH = `${INGESTION_BASE_PATH}2-clean/${PROVIDER_NAME}/`
