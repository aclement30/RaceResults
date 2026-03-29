import type { EventCategory, SanctionedEventType, UpgradePointResult } from './types.ts'

export const hasUpgradePoints = (eventType: SanctionedEventType): 'UPGRADE' | 'SUBJECTIVE' | false => {
  if (!eventType) return false

  if (['A', 'AA', 'AAA', 'AA-USA'].includes(eventType)) return 'UPGRADE'
  if (eventType === 'GRASSROOTS') return 'SUBJECTIVE'

  return false
}

export const hasDoubleUpgradePoints = (eventType: SanctionedEventType): boolean => {
  if (!eventType) return false

  return ['AA', 'AAA', 'AA-USA'].includes(eventType)
}

export const calculateFieldSize = (combinedCategories: Array<Pick<EventCategory, 'results'>>): number => {
  return combinedCategories.reduce((acc, cat) => {
    return acc + (cat?.results.filter((result) => result.status !== 'DNS').length || 0)
  }, 0)
}

export const BC_UPGRADE_POINT_RULES = [
  { fieldSize: [1, 3], points: [8] },
  { fieldSize: [4, 5], points: [8, 6] },
  { fieldSize: [6, 7], points: [8, 6, 5] },
  { fieldSize: [8, 9], points: [8, 6, 5, 4] },
  { fieldSize: [10, 11], points: [8, 6, 5, 4, 3] },
  { fieldSize: [12, 13], points: [8, 6, 5, 4, 3, 2] },
  { fieldSize: [14, 14], points: [8, 6, 5, 4, 3, 2, 1] },
  { fieldSize: [15, 40], points: [10, 8, 6, 5, 4, 3, 2, 1, 1, 1] },
  { fieldSize: [41, 500], points: [12, 10, 8, 7, 6, 5, 4, 3, 2, 1] },
]

export type CombinedCategoryGroup = {
  label: string,
  parentCategory?: string,
  categoriesForPoints?: 'PARENT' | 'SUBCATEGORY',
  categories: string[]
}

// Calculate upgrade points for BC events based on the field size of a group of categories and results
// - Points are assigned based on the position in the ordered results.
export const calculateBCUpgradePoints = ({ category, fieldSize, eventType }: {
  category: Pick<EventCategory, 'alias' | 'results'>,
  fieldSize: number,
  eventType: SanctionedEventType
}): UpgradePointResult[] => {
  const isDouble = eventType && hasDoubleUpgradePoints(eventType)
  const hasPoints = hasUpgradePoints(eventType)

  if (!hasPoints || fieldSize === 0) return []

  // Compare fieldSize with position in BC_UPGRADE_POINT_RULES to get the number of points
  const range = BC_UPGRADE_POINT_RULES.find((rule) => {
    return fieldSize >= rule.fieldSize[0] && fieldSize <= rule.fieldSize[1]
  })?.points

  if (!range) throw new Error(`No upgrade points range found for field size ${fieldSize} (category: ${category.alias}) in event type ${eventType}`)

  const athleteWithPoints: UpgradePointResult[] = []

  // Filter FINISHER results from the category and order by position
  const orderedResults = category.results
  .filter((result) => result.status === 'FINISHER')
  .sort((a, b) => a.position! - b.position!)

  // Assign points based on the position in ordered results
  range.forEach((points, index) => {
    if (orderedResults[index]) {
      athleteWithPoints.push({
        participantId: orderedResults[index].participantId,
        position: orderedResults[index].position!,
        points: points * (isDouble ? 2 : 1),
      })
    }
  })

  return athleteWithPoints
}