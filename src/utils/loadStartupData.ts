import { type EventFile, fetchFilesForYear, fetchResultsYears } from './aws-s3'

export type RaceEvent = Pick<EventFile, 'year' | 'date' | 'organizer' | 'name' | 'series' | 'key'>

export async function loadStartupData() {
  const years = await fetchResultsYears()
  const files = await fetchFilesForYear(2025)

  const events: RaceEvent[] = files
    .filter((file) => file.type === 'event')
    .map((file) => ( {
      key: `${file.date}/${file.organizer}/${file.name}`,
      year: file.year,
      date: file.date,
      organizer: file.organizer,
      name: file.name,
      series: file.series,
    } ))

  return {
    years,
    events,
    files,
  }
}