import type { EventCategory, EventSummary, SanctionedEventType } from '../../../src/types/results.ts'
import {
  BC_SANCTIONED_EVENT_TYPES,
  BC_UPGRADE_POINT_RULES,
  COMBINED_RACE_CATEGORIES
} from '../../../src/config/upgrade-points.ts'

export const hasUpgradePoints = (eventType: SanctionedEventType | null): 'UPGRADE' | 'SUBJECTIVE' | false => {
  if (!eventType) return false

  if (['A', 'AA', 'AA-USA', 'CYCLING-CANADA'].includes(eventType)) return 'UPGRADE'
  if (eventType === 'GRASSROOTS') return 'SUBJECTIVE'

  return false
}

export const getSanctionedEventType = (event: Pick<EventSummary, 'name' | 'serie' | 'organizerAlias'> | null): SanctionedEventType | null => {
  if (!event) return null

  if (event.organizerAlias === 'GoodRideGravel') return 'MASS-PARTICIPATION'
  if (event.serie === 'WTNC2025') return 'GRASSROOTS'
  if (event.serie === 'WTNC2024') return 'A'
  if (event.serie === 'BCProvincials') return 'AA'
  if (event.serie === 'SpringSeries') return 'A'
  if (event.serie === 'LMCX2024') return 'A'
  if (event.organizerAlias === 'LocalRide') return 'A'
  if (event.organizerAlias === 'ShimsRide') return 'A'
  if (event.organizerAlias === 'Concord') return 'A'
  if (event.organizerAlias === 'EscapeVelocity' && event.name.includes('Seymour Challenge')) return 'A'

  return null
}

export const getSanctionedEventTypeLabel = (eventType: SanctionedEventType | null): string => {
  if (!eventType || !BC_SANCTIONED_EVENT_TYPES[eventType]) return 'Unknown'

  return BC_SANCTIONED_EVENT_TYPES[eventType]
}

export const hasDoubleUpgradePoints = (eventType: SanctionedEventType | null): boolean => {
  if (!eventType) return false

  return ['AA', 'AA-USA', 'CYCLING-CANADA'].includes(eventType)
}

export const calculateFieldSize = (eventHash: string, category: string, results: Record<string, EventCategory>): number => {
  // Check if selected category has been combined with another category
  if (COMBINED_RACE_CATEGORIES[eventHash]) {
    const index = COMBINED_RACE_CATEGORIES[eventHash].findIndex((categories) => categories.includes(category))
    if (index !== -1) {
      // If combined, return the size of the first category in the combined categories
      const combinedCategories = COMBINED_RACE_CATEGORIES[eventHash][index]

      return combinedCategories.reduce((acc, cat) => {
        return acc + (results[cat]?.results.filter((result) => result.status !== 'DNS').length || 0)
      }, 0)
    }
  }

  // If no combined categories, return the size of the selected category
  return results[category]?.results.filter((result) => result.status !== 'DNS').length || 0
}

export const getCombinedRaceCategories = (eventHash: string, category: string): string[] | null => {
  // Check if selected category has been combined with another category
  if (COMBINED_RACE_CATEGORIES[eventHash]) {
    const index = COMBINED_RACE_CATEGORIES[eventHash].findIndex((categories) => categories.includes(category))
    if (index !== -1) {
      // If combined, return the size of the first category in the combined categories
      return COMBINED_RACE_CATEGORIES[eventHash][index]
    }
  }

  return null
}

export const calculateBCUpgradePoints = ({ position, fieldSize, eventType }: {
  position: number,
  fieldSize: number,
  eventType: SanctionedEventType | null
}): number | null => {
  const isDouble = eventType && hasDoubleUpgradePoints(eventType)
  const hasPoints = hasUpgradePoints(eventType)

  if (!hasPoints) return null

  // Compare fieldSize with position in BC_UPGRADE_POINT_RULES to get the number of points
  const range = BC_UPGRADE_POINT_RULES.find((rule) => {
    return fieldSize >= rule.fieldSize[0] && fieldSize <= rule.fieldSize[1]
  })?.points

  if (!range) return null

  if (range && range[position - 1]) return range[position - 1] * (isDouble ? 2 : 1)

  return 0
}