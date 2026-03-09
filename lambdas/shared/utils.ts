import shortHash from 'short-hash'
import { cloneDeep, uniq } from 'lodash-es'
import type {
  AthleteRaceResult,
  BaseCategory,
  EventCategory,
  EventResults,
  RaceEvent,
} from './types.ts'
import { AwsS3Client } from './aws-s3.ts'
import { RR_S3_BUCKET } from './config.ts'
import { COMBINED_RACE_CATEGORIES, type CombinedCategoryGroup } from './upgrade-points.ts'

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

export function getBaseCategories(
  combinedCategories: Record<string, Pick<EventCategory, 'alias' | 'label' | 'gender' | 'combinedCategories' | 'umbrellaCategory'>>,
  eventSummary: Pick<RaceEvent, 'organizerAlias' | 'serie'>
): BaseCategory[] {
  return Object.values(combinedCategories)
  .map((cat) => ({
    alias: cat.alias,
    label: cat.label,
    gender: cat.gender,
    combinedCategories: cat.combinedCategories,
    umbrellaCategory: cat.umbrellaCategory,
  }))
  .sort(sortByCategory(eventSummary))
}

export const sortByCategory = ({ organizerAlias, serie }: Partial<Pick<RaceEvent, 'organizerAlias' | 'serie'>>) => {
  let customOrder: string[] = []

  if (organizerAlias === 'CRC') {
    customOrder = [
      'expert (m)',
      'expert (w)',
      'advanced (m)',
      'advanced (w)',
      'sport (m)',
      'sport (w)',
      'novice (m)',
      'novice (w)'
    ]
  } else if (organizerAlias === 'EscapeVelocity' && serie === 'WTNC2025') {
    customOrder = [
      'men/youth 1/2 (m-a)',
      'men 1/2 (ma-a)',
      'men/youth 3 (m-b)',
      'men 3 (ma-b)',
      'youth m3 (my-b)',
      'men/youth 4 (m-c)',
      'men 4 (ma-c)',
      'youth m4 (my-c)',
      'men/youth 5 (m-d)',
      'men 5 (ma-d)',
      'youth m5 (my-d)',
      'women 1/2/3 (wa-a)',
      'women/youth 4/5 (w-b)',
      'women 4/5 (wa-b)',
      'youth w4/5 (wy-b)',
      'gentlemen of leisure'
    ]
  } else if (organizerAlias === 'ShimsRide') {
    customOrder = [
      'pro 1/2 + masters 1/2 (m)',
      'cat 3/4 + masters 1/2/3 (m)',
      'cat 4/5 (m)',
      'w1/2/3 (w)',
      'cat 3/4/5 + masters women (w)',
      'masters of leisure (m)',
      'para',
    ]
  }

  if (customOrder.length) {
    return (a: { label: string }, b: { label: string }): number => {
      const indexA = customOrder.indexOf(a.label.toLowerCase())
      const indexB = customOrder.indexOf(b.label.toLowerCase())

      if (indexA === -1 && indexB === -1) return 0
      if (indexA === -1) return 1
      if (indexB === -1) return -1

      return indexA - indexB
    }
  }

  // Default sorting: Elite categories first, then alphabetical
  return (a: { label: string }, b: { label: string }): number => {
    if (!a.label.toLowerCase().startsWith('elite') && b.label.toLowerCase().startsWith('elite'))
      return 1
    if (a.label.toLowerCase().startsWith('elite') && !b.label.toLowerCase().startsWith('elite'))
      return -1
    return a.label < b.label ? -1 : 1
  }
}

export const transformCategory = (catName: string): string => {
  return catName.replace('(Men)', '(M)').replace('(Women)', '(W)')
}

export const formatCategoryAlias = (catName: string): string => {
  const alias = catName.toLowerCase().replace('(m)', 'm').replace('(w)', 'w').replace('(open)', 'x').replace(/[\s\/]/g, '-').replace(/\+/g, '').replace(/---/, '-').trim()

  return alias
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
  const commonValues: T[] = uniq(objects.map(o => o[field]))

  if (commonValues?.length === 1) return commonValues[0]

  return undefined
}

export const createUmbrellaCategories = (
  categories: Record<string, EventCategory>,
  combinedCategoryGroups: CombinedCategoryGroup[]
): { categories: Record<string, EventCategory>, errors?: string[] } => {
  const updatedCategories: Record<string, EventCategory> = cloneDeep(categories)
  const errors: string[] = []

  // Find umbrella categories for combined categories groups
  Object.values(categories).forEach((category) => {
    const categoryGroup = combinedCategoryGroups.find(group => group.umbrellaCategory === category.alias)

    // If the category is umbrella category, set the combined categories & the umbrella category label
    if (categoryGroup) {
      updatedCategories[category.alias].combinedCategories = categoryGroup.categories.filter(cat => !!categories[cat])
      updatedCategories[category.alias].label = categoryGroup.label

      categoryGroup.categories.forEach(alias => {
        if (updatedCategories[alias]) updatedCategories[alias].umbrellaCategory = category.alias
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
        else {
          errors.push(`Combined category ${alias} not found in event categories`)
        }
      }).filter(c => !!c)

      // Create an umbrella category for the subgroup
      const newCategory = combineCategories(categoryGroup.label, combinedCategories)
      newCategory.combinedCategories = categoryGroup.categories.filter(cat => !!categories[cat])
      updatedCategories[newCategory.alias] = newCategory

      categoryGroup.categories.forEach(alias => {
        if (updatedCategories[alias]) updatedCategories[alias].umbrellaCategory = newCategory.alias
      })
    }
  })

  return { categories: updatedCategories, errors: errors.length ? errors : undefined }
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
    distanceUnit: categories[0]?.distanceUnit || 'km',
    lapDistance: findCommonValue(categories, 'lapDistance'),
    raceDistance: findCommonValue(categories, 'raceDistance'),

    results: combinedResults,
    primes: combinedPrimes,
  }
}

// Find combined categories for a specific event
export const getCombinedRaceCategories = ({
  hash,
  serie,
  organizerAlias,
  name,
  year,
}: Pick<RaceEvent, 'hash' | 'serie' | 'organizerAlias' | 'name' | 'year'>): CombinedCategoryGroup[] => {
  let categoriesOverrides: CombinedCategoryGroup[] = []

  // Check if selected category has been combined with another category
  if (COMBINED_RACE_CATEGORIES[hash]) {
    categoriesOverrides = COMBINED_RACE_CATEGORIES[hash]
  } else if (serie === 'WTNC2025') {
    // Special case for WTNC2025 where categories are grouped by start time
    categoriesOverrides = [
      {
        label: 'Men/Youth 1/2 (M-A)',
        umbrellaCategory: 'men-youth-1-2-(m-a)',
        categories: [
          'men-1-2-(ma-a)',
          'youth-m1-2-(my-a)'
        ],
      },
      {
        label: 'Men/Youth 3 (M-B)',
        umbrellaCategory: 'men-youth-3-(m-a)',
        categories: [
          'men-3-(ma-b)',
          'youth-m3-(my-b)',
        ],
      },
      {
        label: 'Men/Youth 4 (M-C)',
        umbrellaCategory: 'men-youth-4-(m-c)',
        categories: [
          'men-4-(ma-c)',
          'youth-m4-(my-c)',
        ],
      },
      {
        label: 'Men/Youth 5 (M-D)',
        umbrellaCategory: 'men-youth-5-(m-d)',
        categories: [
          'men-5-(ma-d)',
          'youth-m5-(my-d)',
        ],
      },
      {
        label: 'Women/Youth 4/5 (W-B)',
        umbrellaCategory: 'women-youth-4-5-(w-b)',
        categories: [
          'women-4-5-(wa-b)',
          'youth-w4-5-(wy-b)',
        ],
      },
    ]
  } else if (serie === 'VCL2025') {
    categoriesOverrides = [
      {
        label: 'A - Overall',
        umbrellaCategory: 'a-overall',
        categories: [
          'a-male-adult',
          'a-male-u19',
          'a-female-adult',
          'a-female-u19',
        ],
      },
      {
        label: 'B - Overall',
        umbrellaCategory: 'b-overall',
        categories: [
          'b-male-adult',
          'b-male-u19',
          'b-female-adult',
          'b-female-u19',
        ],
      },
      {
        label: 'C/D - Overall',
        umbrellaCategory: 'c-d-overall',
        categories: [
          'c-male-adult',
          'c-male-u19',
          'c-female-adult',
          'c-female-u19',
          'd-male-adult',
          'd-male-u19',
          'd-female-adult',
          'd-female-u19',
        ],
      },
    ]
  } else if (organizerAlias === 'LocalRide' && year === 2026) {
    if (name === 'Thunderbird') {
      categoriesOverrides = [
        {
          label: 'B Wave',
          umbrellaCategory: 'wave-b-x',
          categories: [
            'b-m',
            'b-w',
            'b-masters-m',
          ],
        },
        {
          label: 'C Wave',
          umbrellaCategory: 'wave-c-x',
          categories: [
            'c-m',
            'c-w',
            'c-masters-m',
          ],
        },
      ]
    } else if (name === 'Thornhill') {
      categoriesOverrides = [
        {
          label: 'B (M) + Masters (M)',
          umbrellaCategory: 'b-m--masters-(m)',
          categories: [
            'b-m',
            'b-masters-m',
          ],
        },
        {
          label: 'C/D (W) + D (M)',
          umbrellaCategory: 'wave-c-d-x',
          categories: [
            'c-d-w',
            'd-m',
          ],
        },
      ]
    } else if (name === 'Wix Brown') {
      categoriesOverrides = [
        {
          label: 'B (M) + Masters (M)',
          umbrellaCategory: 'b-m--masters-(m)',
          categories: [
            'b-m',
            'b-masters-m',
          ],
        },
        {
          label: 'C (M) + Masters (M)',
          umbrellaCategory: 'c-m--masters-(m)',
          categories: [
            'c-m',
            'c-masters-m',
          ],
        },
        {
          label: 'C/D (W)',
          umbrellaCategory: 'wave-c-d-w',
          categories: [
            'c-w',
            'd-w',
          ],
        },
      ]
    }
  }

  if (categoriesOverrides.length) return categoriesOverrides

  return []
}

export const shapeCategoriesResults = (results: EventResults['results']): EventResults['results'] => {
  return Object.keys(results).reduce((updatedResults, key) => {
    const category = results[key]

    let lapGapsByAthlete: Record<string, Array<number | null>> = {}

    if (category.laps && category.laps > 1) {
      lapGapsByAthlete = calculateLapGaps(category.results, category.laps)
    }

    updatedResults[key] = {
      ...category,
      results: category.results.map((result) => ({
        athleteId: result.athleteId,
        position: result.position,
        bibNumber: result.bibNumber,
        finishTime: result.finishTime,
        finishGap: result.finishGap,
        avgSpeed: result.avgSpeed,
        status: result.status,
        relegated: result.relegated,
        lapSpeeds: result.lapSpeeds,
        lapDurations: result.lapDurations,
        lapGaps: result.bibNumber ? lapGapsByAthlete[result.athleteId] : undefined,
      })),
    }

    return updatedResults
  }, {} as EventResults['results'])
}

const calculateLapGaps = (
  results: AthleteRaceResult[],
  lapCount: number
): Record<string, Array<number | null>> => {
  const lapGaps: Record<string, Array<number | null>> = {}

  for (let i = 1; i < lapCount + 1; i++) {
    const firstRiderPastTheLine = results.reduce((
      prev,
      curr
    ) => !curr.lapTimes?.[i] || prev.lapTimes![i] < curr.lapTimes?.[i] ? prev : curr)

    results.forEach(({ athleteId, lapTimes }) => {
      const riderGapInCurrentLap = lapTimes![i] ? lapTimes![i] - firstRiderPastTheLine.lapTimes![i] : null

      if (!lapGaps.hasOwnProperty(athleteId)) lapGaps[athleteId] = []
      lapGaps[athleteId].push(riderGapInCurrentLap)
    })
  }

  return lapGaps
}