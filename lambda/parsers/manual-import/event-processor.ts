import type { ManualImportEventSerieFile } from './types.ts'
import type { EventResults, EventSummary, SerieResults, SerieSummary } from '../../../src/types/results.ts'
import { importSeriesResults } from './series-results.ts'
import { writeEventsOrSeries, writeResults } from '../shared/utils.ts'
import defaultLogger from '../shared/logger.ts'

const logger = defaultLogger.child({ provider: 'manual-import' })

export const processEvents = async (eventFiles: ManualImportEventSerieFile[]) => {
  const raceEvents: Record<string, EventSummary[]> = {}
  const series: Record<string, SerieSummary[]> = {}
  const eventResults: Record<string, Record<string, EventResults>> = {}
  const serieResults: Record<string, Record<string, SerieResults>> = {}

  const processedEvents = await Promise.allSettled(eventFiles.map(async (eventWithFiles) => {
    const { files, ...event } = eventWithFiles

    if (event.type === 'series') {
      return importSeriesResults(event, files)
    } else {
      throw new Error('Unsupported import file type: ' + event.type)
    }
  }))

  processedEvents.forEach((parseResult) => {
    if (parseResult.status === 'fulfilled') {
      const targetYear = parseResult.value.summary.year

      const { summary, results, type } = parseResult.value

      // if (type === 'event') {
      //   if (!raceEvents[targetYear]) raceEvents[targetYear] = []
      //   if (!eventResults[targetYear]) eventResults[targetYear] = {}
      //
      //   raceEvents[targetYear] = raceEvents[targetYear].concat(summary as EventSummary)
      //   eventResults[targetYear][summary.hash] = results as EventResults
      // } else
      if (type === 'series') {
        if (!series[targetYear]) series[targetYear] = []
        if (!serieResults[targetYear]) serieResults[targetYear] = {}

        series[targetYear] = series[targetYear].concat(summary as SerieSummary)
        serieResults[targetYear][summary.hash] = results as SerieResults
      }
    } else {
      logger.error(parseResult.reason)
    }
  })

  if (Object.keys(raceEvents).length) await writeEventsOrSeries(raceEvents, 'events')
  if (Object.keys(eventResults).length) await writeResults(eventResults, 'events')
  if (Object.keys(series).length) await writeEventsOrSeries(series, 'series')
  if (Object.keys(serieResults).length) await writeResults(serieResults, 'series')
  
  return {
    events: raceEvents,
    series,
  }
}