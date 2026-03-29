import { startCase } from 'lodash-es'
import shortHash from 'short-hash'
import { RuleEngine } from './rule-engine'
import type { RaceEvent, RaceType, SanctionedEventType, TDiscipline } from './types.ts'
import { capitalize, formatProvince } from './utils.ts'

// Create a unique hash for an event or serie based on its key attributes
export const createEventSerieHash = (inputData: {
  year: number,
  organizer: string,
  type: 'serie' | 'event' | 'doc' | 'startlist',
  name?: string | null,
  date?: string | null
}): string => {
  return shortHash(`${inputData.year}/${inputData.organizer}/${inputData.type}/${inputData.date}/${inputData.name}`)
}

export const getRaceType = async (event: Pick<RaceEvent, 'discipline' | 'name'> & {
  isTimeTrial?: boolean
}): Promise<RaceType | null> => {
  if (event.discipline !== 'ROAD') return null

  return RuleEngine.matchAttribute(event, 'raceType')
}

export const transformOrganizerAlias = async (
  organizerAlias: string,
  context: { eventName?: string, city?: string, organizerName?: string, year?: number } = {}
): Promise<string> => {
  return await RuleEngine.matchAttribute<string>({ organizerAlias, ...context }, 'organizerAlias') ?? organizerAlias
}

export const transformSerieAlias = async ({ alias, organizerAlias, year }: {
  alias?: string | null,
  organizerAlias: string,
  year: number
}): Promise<string | null> => {
  const result = await RuleEngine.matchAttribute<string>({ alias, organizerAlias, year }, 'serieAlias')

  if (result === '') return null

  return result ?? alias ?? null
}

export const transformLocation = (locationStr: string): { city: string, province: string, country: 'CA' | 'US' } => {
  const parts = locationStr.split(',')

  return {
    city: capitalize(parts[0].trim()),
    province: formatProvince(parts[1].trim().toUpperCase())!,
    country: parts[2]?.trim().toUpperCase().slice(0, 2) as 'CA' | 'US',
  }
}

export const formatSerieName = ({ alias, organizerAlias, year }: {
  alias: string,
  organizerAlias: string,
  year: number
}): string => {
  return startCase(alias)
}

export const formatRaceNotes = (raceNotes?: string): string | null => {
  if (!raceNotes) return null

  let notes = raceNotes.trim()
  notes = notes.replace(/{-{(\/?(b|p|li|ul|strong))}-}/g, '<$1>')
  notes = notes.replace(/{-{ul class="(.+)"}-}/g, '<ul>')

  return notes
}

export const getEventDiscipline = async ({ eventName, organizerAlias, serieAlias, sport }: {
  eventName?: string,
  organizerAlias?: string,
  serieAlias?: string | null,
  sport?: string,
}): Promise<TDiscipline> => {
  return (await RuleEngine.matchAttribute<TDiscipline>({
    organizerAlias,
    eventName,
    sport,
    serieAlias,
  }, 'eventDiscipline'))!
}

export const getSanctionedEventType = async ({ eventName, organizerAlias, year, serieAlias }: {
  eventName: string,
  organizerAlias: string,
  year: number,
  serieAlias?: string | null,
}): Promise<SanctionedEventType> => {
  return (await RuleEngine.matchAttribute<SanctionedEventType>({
    eventName,
    organizerAlias,
    year,
    serieAlias
  }, 'sanctionedEventType'))!
}