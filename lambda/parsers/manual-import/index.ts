import defaultLogger from '../shared/logger.ts'
import { fetchManualImportFiles } from './aws-s3.ts'
import { processEvents } from './event-processor.ts'

const logger = defaultLogger.child({ provider: 'manual-import' })
const currentYear = new Date().getFullYear()

export async function main() {
  try {
    const allFiles = await fetchManualImportFiles()

    const { event: eventFiles, series: seriesFiles } = allFiles

    logger.info(`${eventFiles?.length || 0} events found`)
    logger.info(`${seriesFiles?.length || 0} series found`)

    const { events: updatedEvents, series: updatedSeries } = await processEvents([...eventFiles, ...seriesFiles])

    return {
      events: updatedEvents[currentYear]?.map(e => `${e.date} - ${e.name}`).join(','),
      series: updatedSeries[currentYear]?.map(e => `${e.year} - ${e.name}`).join(','),
    }
  } catch (error) {
    logger.error(error)
  }
}