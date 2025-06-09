import { fetchEventResultFilesForYear } from './aws-s3.ts'
import { processEventResults } from './processor.ts'
import defaultLogger from 'ingestion/shared/logger.ts'

// const currentYear = new Date().getFullYear()
const currentYear = 2025
const logger = defaultLogger.child({ provider: 'athletes' })

export async function main() {
  try {
    const yearStoredEventFiles = await fetchEventResultFilesForYear(currentYear)

    await processEventResults(yearStoredEventFiles, currentYear)
  } catch (error) {
    logger.error(error)
  }
}