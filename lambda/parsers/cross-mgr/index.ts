import { fetchFilesForYear, fetchResultsYears } from './aws-s3.ts'
import defaultLogger from '../shared/logger.ts'
import { getLastCheckDate, setLastCheck } from '../shared/utils.ts'
import { processEvents } from './event-processor.ts'

const logger = defaultLogger.child({ provider: 'cross-mgr' })

const MIN_YEAR = 2020

export async function main() {
  const currentYear = new Date().getFullYear()
  const lastCheckDate = await getLastCheckDate('cross-mgr')

  // Fetch event files changed since last check date
  const updatedEventFiles = await fetchFilesForYear(currentYear, lastCheckDate)

  const { event: eventFiles, series: seriesFiles } = updatedEventFiles

  logger.info(`${eventFiles?.length} updated events found`)
  logger.info(`${seriesFiles?.length} updated series found`)

  const {
    events: updatedEvents,
    series: updatedSeries
  } = await processEvents([...( eventFiles || [] ), ...( seriesFiles || [] )])

  // Update last check date on S3
  await setLastCheck('cross-mgr', new Date(), { eventChanges: eventFiles?.length })

  return {
    events: updatedEvents[currentYear]?.map(e => `${e.date} - ${e.name}`).join(','),
    series: updatedSeries[currentYear]?.map(e => `${e.year} - ${e.name}`).join(','),
  }
}

export async function refreshYear(fetchAllYears = false) {
  let years: number[] = []

  try {
    years = await fetchResultsYears().then((years) => years.sort().reverse())
  } catch (error) {
    logger.error(error)
  }

  const targetYears = [years[0]]

  if (fetchAllYears) {
    let i = 1
    while (years[i] >= MIN_YEAR) {
      targetYears.push(years[i])
      i += 1
    }
  }

  logger.info('Parsing events for year: ' + targetYears.join(', '))

  for (const targetYear of targetYears) {
    const allFiles = await fetchFilesForYear(targetYear)

    const { event: eventFiles, series: seriesFiles } = allFiles

    logger.info(`${targetYear}: ${eventFiles?.length || 0} events found`)
    logger.info(`${targetYear}: ${seriesFiles?.length || 0} series found`)

    await processEvents([...( eventFiles || [] ), ...( seriesFiles || [] )])
  }
}