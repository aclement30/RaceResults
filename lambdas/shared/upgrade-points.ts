import type {
  EventCategory,
  EventSummary,
  SanctionedEventType,
  UpgradePointResult
} from '../../src/types/results.ts'

export const hasUpgradePoints = (eventType: SanctionedEventType | null): 'UPGRADE' | 'SUBJECTIVE' | false => {
  if (!eventType) return false

  if (['A', 'AA', 'AAA', 'AA-USA'].includes(eventType)) return 'UPGRADE'
  if (eventType === 'GRASSROOTS') return 'SUBJECTIVE'

  return false
}

export const getSanctionedEventType = (event: Pick<EventSummary, 'name' | 'serie' | 'organizerAlias' | 'year'> | null): SanctionedEventType | null => {
  if (!event) return null

  if (event.organizerAlias === 'GoodRideGravel') return 'MASS-PARTICIPATION'
  if (event.serie === 'WTNC2025') return 'GRASSROOTS'
  if (event.serie === 'WTNC2024') return 'A'
  if (event.serie === 'BCProvincials') return 'AA'
  if (event.serie === 'SpringSeries') return 'A'
  if (event.serie === 'MastersNational') return 'AAA'
  if (event.serie === 'LMCX2024') return 'A'
  if (event.organizerAlias === 'LocalRide') return 'A'
  if (event.organizerAlias === 'ShimsRide') return 'A'
  if (event.organizerAlias === 'Concord') return 'A'
  if (event.organizerAlias === 'GastownGP') return 'A'
  if (event.organizerAlias === 'EscapeVelocity' && event.name.includes('Seymour Challenge') && event.year < 2025) return 'A'
  if (event.organizerAlias === 'EscapeVelocity' && event.name.includes('Seymour Challenge') && event.year === 2025) return 'MASS-PARTICIPATION'
  if (event.serie === 'VCL2025') return 'GRASSROOTS'
  if (event.organizerAlias === 'TourDeBloom') return 'AA-USA'
  if (event.serie === 'EPO') return 'AA-USA'

  return null
}

export const hasDoubleUpgradePoints = (eventType: SanctionedEventType | null): boolean => {
  if (!eventType) return false

  return ['AA', 'AAA', 'AA-USA'].includes(eventType)
}

export const calculateFieldSize = (combinedCategories: EventCategory[]): number => {
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
  umbrellaCategory?: string,
  categoriesForPoints?: 'UMBRELLA' | 'SUBCATEGORY',
  categories: string[]
}

export const COMBINED_RACE_CATEGORIES: Record<string, CombinedCategoryGroup[]> = {
  // BC Provincial RR: https://www.victoriacyclingleague.com/_files/ugd/0d2628_ea4801793b964a2bb73245e26e17d35e.pdf
  '75919fe9': [
    {
      label: 'Master C-D (M)',
      categories: [
        'master-c-55-64-m',
        'master-d-65-m',
      ],
    },
    {
      label: 'Master Women',
      categories: [
        'master-a-35-44-w',
        'master-b-45-54-w',
        'master-c-55-64-w',
      ],
    },
    {
      label: 'U23 / Elite Women',
      categories: [
        'elite-w',
        'u23-w',
        'u17-w',
        'u19-w',
      ],
    },
    {
      label: 'U23 / Elite Men',
      categories: [
        'elite-m',
        'u23-m',
      ],
    },
    {
      label: 'U17/U19 Men',
      categories: [
        'u17-m',
        'u19-m',
      ],
    },
    {
      label: 'Open Youth',
      categories: [
        'open-youth-m',
        'open-youth-b-m',
        'open-youth-w',
      ],
    },
  ],
  // BC Provincial Crit:
  // - https://results.wimsey.co/2025/VictoriaCycling/BCProvincials/2025-06-01-BC_Provincial_Crit-0800-startlist.pdf
  // - https://results.wimsey.co/2025/VictoriaCycling/BCProvincials/2025-06-01-BC_Provincial_Crit-0845-startlist.pdf
  // - https://results.wimsey.co/2025/VictoriaCycling/BCProvincials/2025-06-01-BC_Provincial_Crit-0930-startlist.pdf
  // - https://results.wimsey.co/2025/VictoriaCycling/BCProvincials/2025-06-01-BC_Provincial_Crit-1025-startlist.pdf
  // - https://results.wimsey.co/2025/VictoriaCycling/BCProvincials/2025-06-01-BC_Provincial_Crit-1120-startlist.pdf
  // - https://results.wimsey.co/2025/VictoriaCycling/BCProvincials/2025-06-01-BC_Provincial_Crit-1200-startlist.pdf
  // - https://results.wimsey.co/2025/VictoriaCycling/BCProvincials/2025-06-01-BC_Provincial_Crit-1255-startlist.pdf
  // - https://results.wimsey.co/2025/VictoriaCycling/BCProvincials/2025-06-01-BC_Provincial_Crit-1350-startlist.pdf
  // - https://results.wimsey.co/2025/VictoriaCycling/BCProvincials/2025-06-01-BC_Provincial_Crit-1500-startlist.pdf
  '16b74229': [
    {
      label: 'Master Women',
      categories: [
        'master-a-35-44-w',
        'master-b-45-54-w',
        'master-c-55-64-w',
      ],
    },
    {
      label: 'Master C-D (M)',
      umbrellaCategory: 'master-c-d-m',
      categories: [
        'master-c-55-64-m',
        'master-d-65-m',
      ],
    },
    {
      label: 'Open Youth A/B',
      categories: [
        'open-youth-m',
        'open-youth-w',
        'open-youth-b-m',
        'open-youth-b-w',
      ],
    },
    {
      label: 'U17/U19 (M)',
      categories: [
        'u17-m',
        'u19-m',
      ],
    },
    {
      label: 'U17/U19 (W)',
      categories: [
        'u17-w',
        'u19-w',
      ],
    },
    {
      label: 'U23 / Elite (W)',
      categories: [
        'elite-w',
        'u23-w',
      ],
    },
    {
      label: 'U23 / Elite (M)',
      categories: [
        'elite-m',
        'u23-m',
      ],
    },
  ],
  // Seymour Challenge 2024: https://ccnbikes.com/#!/events/seymour-challenge-2024-unofficial-world-hill-climbing-champs
  'e4bd8e41': [
    {
      label: 'Unique & Leisure Ride',
      categories: [
        'leisureride-x',
        'uniqueride-x',
      ],
    },
    {
      label: 'Women + Youth U13/U15 (M)',
      categories: [
        'w-4-5-w',
        'w-u13-w',
        'w-u15-w',
        'm-u13-m',
        'm-u15-m',
        'w-1-2-3-w',
        'w-u17-w',
      ],
    },
    {
      label: 'Masters',
      categories: [
        'm-masters-35-49-m',
        'm-masters-50-64-m',
        'm-masters-65-m',
        'w-masters-w',
      ],
    },
    {
      label: 'Elite Men + M3 + U17/U19',
      categories: [
        'm-1-2-m',
        'm-3-m',
        'm-u17-m',
        'm-u19-m',
      ],
    },
  ],
  // Shim's Ride 2024
  'dee39e14': [
    {
      label: 'Pro 1/2 + Masters 1/2 (M)',
      umbrellaCategory: 'pro-1-2--masters-1-2-m',
      categoriesForPoints: 'UMBRELLA',
      categories: [
        'm1-2-m',
        'masters-m1-2-m',
      ],
    },
    {
      label: 'Cat 3/4 + Masters 1/2/3 (M)',
      umbrellaCategory: 'category-3-4--masters-1-2-3-m',
      categoriesForPoints: 'UMBRELLA',
      categories: [
        'm3-4-m',
        'masters-m1-2-3-m',
      ],
    },
    {
      label: 'Cat 4/5 + Masters 4/5 (M)',
      umbrellaCategory: 'category-4-5-(novice)--masters-4-5-m',
      categoriesForPoints: 'UMBRELLA',
      categories: [
        'm4-5-m',
        'masters-m4-5-m',
      ],
    },
    {
      label: 'Cat 3/4/5 + Masters Women (W)',
      umbrellaCategory: 'category-3-4-5-(novice)--masters-1-2-3-4-w',
      categoriesForPoints: 'UMBRELLA',
      categories: [
        'w3-4-5-w',
        'masters-w1-2-3-4-w',
      ],
    },
  ]
}

// Calculate upgrade points for BC events based on the field size of a group of categories and results
// - Points are assigned based on the position in the ordered results.
export const calculateBCUpgradePoints = ({ category, fieldSize, eventType }: {
  category: EventCategory,
  fieldSize: number,
  eventType: SanctionedEventType | null
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
  .sort((a, b) => a.position - b.position)

  // Assign points based on the position in ordered results
  range.forEach((points, index) => {
    if (orderedResults[index]) {
      athleteWithPoints.push({
        athleteId: orderedResults[index].athleteId,
        position: orderedResults[index].position,
        points: points * (isDouble ? 2 : 1),
      })
    }
  })

  return athleteWithPoints
}