import _ from 'lodash'
import shortHash from 'short-hash'
import type {
  BaseCategory, EventCategory,
} from '../../../src/types/results.ts'
import { AwsS3Client } from './aws-s3.ts'
import { CONFIG_FILES, RR_S3_BUCKET, WATCHERS_PATH } from './config.ts'
import type { CombinedCategoryGroup } from './upgrade-points.ts'

export const s3 = new AwsS3Client(RR_S3_BUCKET)

export function validateYear(year: string | number) {
  if (isNaN(+year)) return false

  return +year >= 2020 && +year <= new Date().getFullYear()
}

export function createEventSerieHash(inputData: {
  year: number,
  organizer: string,
  type: 'serie' | 'event' | 'doc' | 'startlist',
  name?: string | null,
  date?: string | null
}): string {
  return shortHash(`${inputData.year}/${inputData.organizer}/${inputData.type}/${inputData.date}/${inputData.name}`)
}

export function getBaseCategories(combinedCategories: Record<string, Pick<EventCategory, 'alias' | 'label' | 'gender' | 'combinedCategories' | 'umbrellaCategory'>>): BaseCategory[] {
  return Object.values(combinedCategories)
  .map((cat) => ({
    alias: cat.alias,
    label: cat.label,
    gender: cat.gender,
    combinedCategories: cat.combinedCategories,
    umbrellaCategory: cat.umbrellaCategory,
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
  const { files } = await s3.fetchDirectoryFiles(`${WATCHERS_PATH}last-check/`)

  const lastProviderCheckDate = files!.find(f => f.Key!.endsWith(`${provider}.json`))?.LastModified

  return lastProviderCheckDate || null
}

export async function setLastCheck(provider: string, timestamp: Date, extra?: Record<string, any>) {
  const payload = {
    timestamp: timestamp.toISOString(),
    ...(extra || {})
  }

  await s3.writeFile(`${WATCHERS_PATH}last-check/${provider}.json`, JSON.stringify(payload))
}

export async function getEventDays(): Promise<Record<string, 'day' | 'evening'>> {
  const currentYear = new Date().getFullYear()

  const eventDaysJson = await s3.fetchFile(CONFIG_FILES.eventDays)

  if (!eventDaysJson) throw new Error('Event days file could not be found!')

  const allEventDays = JSON.parse(eventDaysJson)
  return allEventDays[currentYear] || {}
}

export const formatProvince = (province: string | null | undefined): string | undefined => {
  if (!province) return

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
    case 'WASHINGTON':
      return 'WA'
    case 'OREGON':
      return 'OR'
    default:
      return formattedProvince
  }
}

export const capitalize = <T extends string | undefined | null>(str: T): T => {
  if (str == null || str === undefined) return str

  // @ts-ignore
  return str.toLowerCase().replace(/(?:^|\s|-|["'([{])+\S/g, match => match.toUpperCase())
}

export const findCommonValue = <T>(objects: Record<string, any>[], field: string): T | undefined => {
  const commonValues: T[] = _.uniq(objects.map(o => o[field]))

  if (commonValues?.length === 1) return commonValues[0]

  return undefined
}

export const createUmbrellaCategories = (
  categories: Record<string, EventCategory>,
  combinedCategoryGroups: CombinedCategoryGroup[]
): Record<string, EventCategory> => {
  const updatedCategories: Record<string, EventCategory> = _.cloneDeep(categories)

  // Find umbrella categories for combined categories groups
  Object.values(categories).forEach((category) => {
    const categoryGroup = combinedCategoryGroups.find(group => group.umbrellaCategory === category.alias)

    // If the category is umbrella category, set the combined categories
    if (categoryGroup) {
      updatedCategories[category.alias].combinedCategories = categoryGroup.categories

      categoryGroup.categories.forEach(alias => {
        updatedCategories[alias].umbrellaCategory = category.alias
      })
    }
  })

  // Create umbrella category for each combined groups, if not already existing
  combinedCategoryGroups.forEach((categoryGroup) => {
    // Check if any of the subset point categories is a WAVE category
    const hasUmbrellaCategory = !!categoryGroup.umbrellaCategory && !!updatedCategories[categoryGroup.umbrellaCategory]

    if (!hasUmbrellaCategory) {
      const combinedCategories = categoryGroup.categories.map(alias => {
        if (updatedCategories[alias]) return updatedCategories[alias]
        else throw new Error(`Combined category ${alias} not found in event categories`)
      }).filter(c => !!c)

      // Create an umbrella category for the subgroup
      const newCategory = combineCategories(categoryGroup.label, combinedCategories)
      newCategory.combinedCategories = categoryGroup.categories
      updatedCategories[newCategory.alias] = newCategory

      categoryGroup.categories.forEach(alias => {
        updatedCategories[alias].umbrellaCategory = newCategory.alias
      })
    }
  })

  return updatedCategories
}

// Combine multiple categories into a single umbrella category
export const combineCategories = (categoryName: string, categories: EventCategory[]): EventCategory => {
  const alias = formatCategoryAlias(categoryName)

  const starters = categories.reduce((acc, cat) => acc + (cat.starters || 0), 0)
  const finishers = categories.reduce((acc, cat) => acc + (cat.finishers || 0), 0)

  // Combine results and update position by finish time
  let combinedResults = categories.flatMap(c => c.results)
  const finisherResults = combinedResults
  .filter(r => r.status === 'FINISHER' && r.finishTime > 0)
  .sort((a, b) => a.finishTime - b.finishTime)
  // Add finishers with finishTime === 0 at the end of finisher results (probably due to wrong timing)
  .concat(combinedResults.filter(r => r.status === 'FINISHER' && r.finishTime === 0))

  const nonFinisherResults = combinedResults.filter(r => r.status !== 'FINISHER')

  combinedResults = [
    ...finisherResults.map((
      result,
      index
    ) => ({
      ...result,
      finishGap: result.finishTime - finisherResults[0].finishTime,
      position: index + 1,
    })),
    ...nonFinisherResults,
  ]

  const combinedPrimes = categories.flatMap(c => c.primes || [])

  return {
    alias,
    label: categoryName,
    gender: findCommonValue(categories, 'gender') || 'X',
    startTime: findCommonValue(categories, 'startTime'),
    laps: findCommonValue(categories, 'laps'),

    starters,
    finishers,
    distanceUnit: categories[0].distanceUnit,
    lapDistance: findCommonValue(categories, 'lapDistance'),
    raceDistance: findCommonValue(categories, 'raceDistance'),

    results: combinedResults,
    primes: combinedPrimes,
  }
}