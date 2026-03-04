import { pick, sortBy } from 'lodash-es'
import { PUBLIC_BUCKET_PATHS } from '../../../src/config/s3.ts'
import { s3 as RRS3 } from '../utils.ts'
import type { EventResults, EventSummary, RaceEvent } from '../types.ts'

export const getEvents = async (filters: {
  year: number,
  eventHash?: string,
  eventHashes?: string[]
  location?: { country: string, province: string }
}, options: { summary?: boolean } = {}): Promise<RaceEvent[] | EventSummary[]> => {
  if (!options?.summary && typeof options.summary === 'undefined') options.summary = true

  const yearStoredEventFiles = await loadEventsForYear(filters.year, options.summary)

  const eventHashes = filters.eventHashes || (filters.eventHash ? [filters.eventHash] : [])

  let filteredEventFiles = eventHashes.length ? yearStoredEventFiles.filter(file => eventHashes.includes(file.hash)) : yearStoredEventFiles

  if (filters.location) {
    filteredEventFiles = filteredEventFiles.filter(event => event.location.country === filters.location!.country && event.location.province === filters.location!.province)
  }

  return filteredEventFiles
}

export const updateEvents = async (events: RaceEvent[], { year }: { year: number }) => {
  const eventsForYear = await loadEventsForYear(year) as RaceEvent[]

  const eventFilename = `${PUBLIC_BUCKET_PATHS.events}${year}.json`

  const updatedEventHashes = events.map(e => e.hash)
  const updatedEvents = [...eventsForYear.filter(e => !updatedEventHashes.includes(e.hash)), ...events]

  await RRS3.writeFile(eventFilename, JSON.stringify(updatedEvents))
}

export const getEventResults = async (eventHash: string, year: number) => {
  const filename = PUBLIC_BUCKET_PATHS.eventsResults + `${year}/${eventHash}.json`

  const fileContent = await RRS3.fetchFile(filename, true)

  if (!fileContent) return undefined

  return JSON.parse(fileContent) as EventResults
}

export const updateEventResults = async (
  eventResults: EventResults,
  { year, eventHash }: { year: number, eventHash: string }
): Promise<void> => {
  const filename = PUBLIC_BUCKET_PATHS.eventsResults + `${year}/${eventHash}.json`

  await RRS3.writeFile(filename, JSON.stringify(eventResults))
}

export const loadEventsForYear = async (
  year: number,
  summary = false
): Promise<RaceEvent[] | EventSummary[]> => {
  const eventFilename = `${PUBLIC_BUCKET_PATHS.events}${year}.json`

  const fileContent = await RRS3.fetchFile(eventFilename, true)

  if (!fileContent) return []

  const events = JSON.parse(fileContent) as RaceEvent[]
  const sortedEvents = sortBy(events, 'date')

  if (!summary) return sortedEvents as RaceEvent[]

  return sortedEvents.map(event => pick(event, [
    'hash',
    'year',
    'date',
    'provider',
    'name',
    'location',
    'sanctionedEventType',
    'discipline',
    'organizerAlias'
  ])) as EventSummary[]
}
