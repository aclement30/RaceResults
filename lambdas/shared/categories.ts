import { cloneDeep, keyBy } from 'lodash-es'
import type { CreateEventCategory } from '../../shared/types'
import { RuleEngine } from './rule-engine'
import type { CombinedCategoryGroup } from './upgrade-points'
import { findCommonValue } from './utils'

export const getIgnoredCategories = async ({ serieAlias }: {
  serieAlias?: string | null,
}): Promise<string[]> => {
  return await RuleEngine.matchAttribute<string[]>({ serieAlias }, 'ignoredCategories') ?? []
}

export const transformCategoryLabel = async (
  categoryName: string,
  context: { eventName?: string, organizerAlias?: string, year?: number, serieAlias?: string | null } = {}
): Promise<string> => {
  const map = await RuleEngine.matchAttribute<Record<string, string>>(
    { ...context },
    'categoryLabel'
  )

  return map?.[categoryName.toLowerCase()] ?? categoryName.replace('(Men)', '(M)').replace('(Women)', '(W)')
}

export const formatCategoryAlias = (categoryName: string): string => {
  return categoryName
  .toLowerCase()
  // Replace spaces with dashes
  .replace(/[\s\/]+/g, '-')
  // Remove parenthesis and special characters except dashes
  .replace(/[^a-z0-9\-]/g, '')
  // Replace multiple dashes with a single dash
  .replace(/-+/g, '-')
  .trim()
}

export const createUmbrellaCategories = (
  categories: CreateEventCategory[],
  combinedCategoryGroups: CombinedCategoryGroup[]
): { categories: CreateEventCategory[], errors?: string[] } => {
  const updatedCategories: Record<string, CreateEventCategory> = keyBy(cloneDeep(categories), 'alias')
  const errors: string[] = []

  // Find parent categories for combined categories groups
  categories.forEach((category) => {
    const categoryGroup = combinedCategoryGroups.find(group => group.parentCategory === category.alias)

    // If the category is parent category, set the combined categories & the umbrella category label
    if (categoryGroup) {
      updatedCategories[category.alias].label = categoryGroup.label

      categoryGroup.categories.forEach(alias => {
        if (updatedCategories[alias]) updatedCategories[alias].parentCategory = category.alias
      })
    }
  })

  // Create parent category for each combined groups, if not already existing
  combinedCategoryGroups.forEach((categoryGroup) => {
    // Check if any of the subset point categories is a WAVE category
    const hasExistingParentCategory = !!categoryGroup.parentCategory && !!updatedCategories[categoryGroup.parentCategory]

    if (!hasExistingParentCategory) {
      const subCategories = categoryGroup.categories.map(alias => {
        if (updatedCategories[alias]) return updatedCategories[alias]
        else {
          errors.push(`Combined category ${alias} not found in event categories`)
        }
      }).filter(c => !!c)

      // Create a parent category for the subgroup
      const newCategory = combineCategories(categoryGroup.label, subCategories)
      updatedCategories[newCategory.alias] = newCategory

      // Update each subcategory to point to the new parent category
      categoryGroup.categories.forEach(alias => {
        if (updatedCategories[alias]) updatedCategories[alias].parentCategory = newCategory.alias
      })
    }
  })

  return { categories: Object.values(updatedCategories), errors: errors.length ? errors : undefined }
}

// Combine multiple categories into a single umbrella category
export const combineCategories = (categoryName: string, categories: CreateEventCategory[]): CreateEventCategory => {
  const alias = formatCategoryAlias(categoryName)

  const starters = categories.reduce((acc, cat) => acc + (cat.starters || 0), 0)
  const finishers = categories.reduce((acc, cat) => acc + (cat.finishers || 0), 0)

  // Combine results and update position by finish time
  let combinedResults = categories.flatMap(c => c.results)
  const finisherResults = combinedResults
  .filter(r => r.status === 'FINISHER' && r.finishTime && r.finishTime > 0)
  .sort((a, b) => a.finishTime! - b.finishTime!)
  // Add finishers with finishTime === 0 at the end of finisher results (probably due to wrong timing)
  .concat(combinedResults.filter(r => r.status === 'FINISHER' && r.finishTime === 0))

  const nonFinisherResults = combinedResults.filter(r => r.status !== 'FINISHER')

  combinedResults = [
    ...finisherResults.map((
      result,
      index
    ) => ({
      ...result,
      finishGap: result.finishTime! - finisherResults[0].finishTime!,
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
    lapDistanceKm: findCommonValue(categories, 'lapDistance'),
    raceDistanceKm: findCommonValue(categories, 'raceDistance'),

    results: combinedResults,
    primes: combinedPrimes,
    upgradePoints: null,
  }
}

// Find combined categories for a specific event
export const getCombinedRaceCategories = async ({ eventHash, serieAlias, organizerAlias, eventName, year }: {
  eventHash: string,
  serieAlias?: string | null,
  organizerAlias: string,
  eventName: string,
  year: number,
}): Promise<CombinedCategoryGroup[]> => {
  return await RuleEngine.matchAttribute<CombinedCategoryGroup[]>({
    eventHash,
    serieAlias,
    organizerAlias,
    eventName,
    year
  }, 'combinedRaceCategories') ?? []
}