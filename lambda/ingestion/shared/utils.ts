import shortHash from 'short-hash'
import type {
  BaseCategory,
} from '../../../src/types/results.ts'
import { AwsS3Client } from './aws-s3.ts'
import { RR_S3_BUCKET } from './config.ts'

export const s3 = new AwsS3Client(RR_S3_BUCKET)

export function validateYear(year: string | number) {
  if (isNaN(+year)) return false

  return +year >= 2020 && +year <= new Date().getFullYear()
}

export function createEventSerieHash(inputData: {
  year: number,
  organizer: string,
  type: 'serie' | 'event' | 'doc' | 'startlist',
  date?: string | null
}): string {
  return shortHash(`${inputData.year}/${inputData.organizer}/${inputData.type}/${inputData.date}`)
}

export function getBaseCategories(combinedCategories: Record<string, BaseCategory>): BaseCategory[] {
  return Object.values(combinedCategories)
    .map((cat: BaseCategory) => ({
      alias: cat.alias,
      label: cat.label,
      gender: cat.gender,
    }))
    .sort(sortByCategory)
}

export function sortByCategory(a: { label: string }, b: { label: string }): number {
  if (!a.label.toLowerCase().startsWith('elite') && b.label.toLowerCase().startsWith('elite'))
    return 1
  if (a.label.toLowerCase().startsWith('elite') && !b.label.toLowerCase().startsWith('elite'))
    return -1
  return a.label < b.label ? -1 : 1
}

export const transformCategory = (catName: string): string => {
  return catName.replace('(Men)', '(M)').replace('(Women)', '(W)')
}

export const formatCategoryAlias = (catName: string): string => {
  const alias = catName.toLowerCase().replace('(m)', 'm').replace('(w)', 'w').replace('(open)', 'x').replace(/[\s\/]/g, '-').replace(/\+/g, '').trim()

  return alias
}

export async function getLastCheckDate(provider: string): Promise<Date | null> {
  const { files } = await s3.fetchDirectoryFiles('watchers/last-check/')

  const lastProviderCheckDate = files!.find(f => f.Key!.endsWith(`${provider}.json`))?.LastModified

  return lastProviderCheckDate || null
}

export async function setLastCheck(provider: string, timestamp: Date, extra?: Record<string, any>) {
  const payload = {
    timestamp: timestamp.toISOString(),
    ...(extra || {})
  }

  await s3.writeFile(`watchers/last-check/${provider}.json`, JSON.stringify(payload))
}

export async function getEventDays(): Promise<Record<string, 'day' | 'evening'>> {
  const currentYear = new Date().getFullYear()

  const eventDaysJson = await s3.fetchFile('watchers/event-days.json')

  if (!eventDaysJson) throw new Error('Event days file could not be found!')

  const allEventDays = JSON.parse(eventDaysJson)
  return allEventDays[currentYear] || {}
}

export const formatProvince = (province: string | null): string | null => {
  if (!province) return null

  const formattedProvince = province.trim().toUpperCase()

  switch (formattedProvince) {
    case 'BC':
    case 'BRITISH COLUMBIA':
      return 'BC'
    case 'AB':
    case 'ALBERTA':
      return 'AB'
    case 'SK':
    case 'SASKATCHEWAN':
      return 'SK'
    case 'MB':
    case 'MANITOBA':
      return 'MB'
    case 'ON':
    case 'ONTARIO':
      return 'ON'
    case 'QC':
    case 'QUEBEC':
      return 'QC'
    case 'NB':
    case 'NEW BRUNSWICK':
      return 'NB'
    case 'NS':
    case 'NOVA SCOTIA':
      return 'NS'
    case 'PEI':
    case 'PRINCE EDWARD ISLAND':
      return 'PE'
    case 'NL':
    case 'NEWFOUNDLAND AND LABRADOR':
      return 'NL'
    default:
      return formattedProvince
  }
}

export const formatTeamName = (teamName: string | null): string | null => {
  if (!teamName) return null

  const formattedName = teamName

  switch (formattedName.toLowerCase()) {
    case 'broad st cycles':
    case 'broad street cycles / stuckylife':
      return 'Broad Street Cycles'
    case 'diversion':
    case 'diversion p/b enroute.cc':
      return 'Diversion p/b Enroute.cc'
    case 'escape velocity / devo club':
    case 'escape velocity / devo':
    case 'escape velocity society/devo':
    case 'ev racing team':
    case 'ev racing':
      return 'Escape Velocity/DEVO'
    case 'femme fatale cycling team':
      return 'Femme Fatale'
    case 'independant':
      return 'Independent'
    case 'lost boys':
      return 'Lost Boys Book Club'
    case 'meraloma':
    case 'meraloma bike club':
      return 'Meraloma Racing'
    case 'red kilo':
      return 'Red Kilo Cycling Team'
    case 'red truck racing':
    case 'red truck racing pb mosaic homes':
      return 'Red Truck Racing p/b Mosaic Homes'
    case 'ruckus racing team':
      return 'Ruckus Racing'
    case 'tag cycling':
    case 'tag race team':
      return 'TaG Cycling Race Team'
    case 'the last drop':
    case 'the last drop cycling team':
      return 'The Last Drop Cycling Club'
    case 'tru grit racing team':
    case 'true grit racing':
      return 'Tru Grit Racing'
    case 'ubc cycling':
      return 'UBC Cycling Team'
    case 'united velo cycling club':
      return 'United Velo'
    default:
      return formattedName
  }
}

export const capitalize = <T extends string | undefined | null>(str: T): T => {
  if (str == null || str === undefined) return str

  // @ts-ignore
  return str.toLowerCase().replace(/(?:^|\s|-|["'([{])+\S/g, match => match.toUpperCase())
}