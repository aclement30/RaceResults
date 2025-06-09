import { INGESTION_BASE_PATH } from '../shared/config.ts'

export const CLEAN_EVENT_DATA_PATH = `${INGESTION_BASE_PATH}2-clean/`
export const PARSER_NAME = 'athletes'
export const EXTRACTED_ATHLETES_FILE = `${INGESTION_BASE_PATH}athletes/extracted.json`
export const DUPLICATE_ATHLETES_FILE = `${INGESTION_BASE_PATH}athletes/duplicates.json`
export const CLEAN_ATHLETES_FILE = `${INGESTION_BASE_PATH}athletes/extracted.json`
