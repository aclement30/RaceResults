import { INGESTION_BASE_PATH } from '../../shared/config.ts'

export const PARSER_NAME = 'athletes'

export const RAW_DATA_PATH = `${INGESTION_BASE_PATH}1-raw/${PARSER_NAME}/`
export const CLEAN_DATA_BASE_PATH = `${INGESTION_BASE_PATH}2-clean/`
export const CLEAN_DATA_PATH = `${CLEAN_DATA_BASE_PATH}${PARSER_NAME}/`
export const EXTRACTED_ATHLETES_FILE = `${RAW_DATA_PATH}extracted-athletes.json`
export const EXTRACTED_UPGRADE_POINTS_FILE = `${RAW_DATA_PATH}extracted-upgrade-points.json`
export const EXTRACTED_RACES_FILE = `${RAW_DATA_PATH}extracted-races.json`
export const DUPLICATE_ATHLETES_FILE = `${CLEAN_DATA_PATH}duplicates.json`
export const CLEAN_ATHLETES_FILE = `${CLEAN_DATA_PATH}clean.json`
export const CLEAN_ATHLETE_UPGRADE_POINTS_FILE = `${CLEAN_DATA_PATH}clean-upgrade-points.json`
export const CLEAN_ATHLETE_RACES_FILE = `${CLEAN_DATA_PATH}clean-races.json`
export const CLEAN_ATHLETE_TEAMS_FILE = `${CLEAN_DATA_PATH}clean-teams.json`
export const CLEAN_ATHLETE_UPGRADE_DATES_FILE = `${CLEAN_DATA_PATH}clean-upgrade-dates.json`
