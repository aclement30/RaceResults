import { fetchFilesForYear, fetchResultsYears, groupEventFiles } from './aws-s3.ts'
import defaultLogger from '../shared/logger.ts'
import { processEvents } from './event-processor.ts'
import type { CrossMgrEventFile } from './types.ts'
import { getLastCheckDate, setLastCheck } from '../shared/utils.ts'

const logger = defaultLogger.child({ provider: 'cross-mgr' })

const MIN_YEAR = 2020

export async function main() {
  const currentYear = new Date().getFullYear()
  const lastCheckDate = await getLastCheckDate('cross-mgr')

  logger.info(`Fetching updated files since ${lastCheckDate}`)

  // Fetch event files changed since last check date
  const updatedEventFiles = await fetchFilesForYear(currentYear, { lastModifiedSince: lastCheckDate })

  let eventFiles = updatedEventFiles.filter(e => e.type === 'event')
  const seriesFiles = updatedEventFiles.filter(e => e.type === 'series')

  if (eventFiles?.length) {
    let otherEventFiles: CrossMgrEventFile[] = []

    for (const eventFile of eventFiles) {
      // Fetch other event files for the same organizer/year and series (eg. other categories of same event)
      const similarEventFiles = await fetchFilesForYear(currentYear, {
        organizer: eventFile.organizer,
        serie: eventFile.series
      })

      otherEventFiles = otherEventFiles.concat(similarEventFiles.filter(e => e.type === 'event'))
    }

    // Consolidate all event files for the same date, organizer & type
    const consolidatedEventFiles = groupEventFiles([...eventFiles, ...otherEventFiles])
    eventFiles = consolidatedEventFiles.filter(e => e.type === 'event')
  }

  logger.info(`${eventFiles?.length || 0} updated events found`)
  logger.info(`${seriesFiles?.length || 0} updated series found`)

  const {
    events: updatedEvents,
    series: updatedSeries
  } = await processEvents([...( eventFiles || [] ), ...( seriesFiles || [] )])

  // Update last check date on S3
  await setLastCheck('cross-mgr', new Date(), { eventChanges: eventFiles?.length })

  return {
    events: updatedEvents[currentYear]?.map(e => `${e.date} - ${e.name}`).join(',') || '',
    series: updatedSeries[currentYear]?.map(e => `${e.year} - ${e.name}`).join(',') || '',
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

    const eventFiles = allFiles.filter(e => e.type === 'event')
    const seriesFiles = allFiles.filter(e => e.type === 'series')

    logger.info(`${targetYear}: ${eventFiles?.length || 0} events found`)
    logger.info(`${targetYear}: ${seriesFiles?.length || 0} series found`)

    await processEvents([...( eventFiles || [] ), ...( seriesFiles || [] )])
  }
}