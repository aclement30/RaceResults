import { type EventFile, fetchResultsYears } from './aws-s3'

export type BaseEvent = Pick<EventFile, 'year' | 'date' | 'organizer' | 'name' | 'series' | 'hash'>

export async function loadStartupData() {
  const years = await fetchResultsYears()

  return {
    years,
  }
}