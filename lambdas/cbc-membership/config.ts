import { INGESTION_BASE_PATH } from '../shared/config.ts'

export const SCRIPT_NAME = 'cbc-membership'

export const MEMBERSHIP_OUTPUT_PATH = `${INGESTION_BASE_PATH}1-raw/cbc-memberships/`
export const CLEAN_ATHLETE_CATEGORIES_FILE = `${INGESTION_BASE_PATH}2-clean/athletes/cbc-categories.json`
