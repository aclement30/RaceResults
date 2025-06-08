import type { Athlete, AthleteRaceResult, EventResults, EventSummary } from '../types/results'
import { useMemo } from 'react'
import { BC_UPGRADE_POINT_RULES, COMBINED_RACE_CATEGORIES } from '../config/upgrade-points'

export const useCategoryResults = (results: AthleteRaceResult[], athletes: Record<string, Athlete>, searchValue?: string) => {
  const sortedResults = useMemo(() => {
    const finishers = results.filter((result) => result.status === 'FINISHER')

    let sortedResults = [...finishers].sort((a, b) => a.position - b.position)

    const nonFinishers = results.filter((result) => result.status === 'DNF').sort((a, b) => b.finishTime - a.finishTime)
    sortedResults = [...sortedResults, ...nonFinishers]

    const nonStarters = results.filter((result) => result.status === 'DNS')
    sortedResults = [...sortedResults, ...nonStarters]

    const otherResults = results.filter((result) => !['FINISHER', 'DNF', 'DNS'].includes(result.status))
    sortedResults = [...sortedResults, ...otherResults]

    return sortedResults
  }, [results])

  const filteredResults = useMemo(() => {
    if (!searchValue) return sortedResults

    const searchValueLower = searchValue.toLowerCase().trim()

    return sortedResults.filter((raceResult) => {
      if (isNaN(+searchValueLower)) {
        const { firstName, lastName, team } = athletes[raceResult.bibNumber]
        const fullName = `${firstName} ${lastName}`.toLowerCase()
        const teamLower = team.toLowerCase()

        return fullName.includes(searchValueLower) || teamLower.includes(searchValueLower)
      } else {
        const bibNumber = +searchValueLower
        return raceResult.bibNumber.toString().startsWith(bibNumber.toString())
      }
    })
  }, [sortedResults, searchValue])

  const isFiltered = filteredResults.length !== sortedResults.length

  return { filteredResults, sortedResults, isFiltered }
}

export const hasUpgradePoints = (event: EventSummary | null): 'UPGRADE' | 'SUBJECTIVE' | false => {
  const eventType = getSanctionedEventType(event)

  if (!eventType) return false

  if (['A', 'AA', 'AA-USA', 'CYCLING-CANADA'].includes(eventType)) return 'UPGRADE'
  if (eventType === 'GRASSROOTS') return 'SUBJECTIVE'

  return false
}

const SANCTIONED_EVENT_TYPES = {
  GRASSROOTS: 'Grassroots Race',
  A: 'A-Race',
  AA: 'AA-Race',
  'AA-USA': 'AA-USA',
  'CYCLING-CANADA': 'Cycling Canada',
  'MASS-PARTICIPATION': 'Mass Participation Race',
}

type SanctionedEventType = keyof typeof SANCTIONED_EVENT_TYPES

export const getSanctionedEventType = (event: EventSummary | null): SanctionedEventType | false => {
  if (!event) return false

  if (event.organizerAlias === 'GoodRideGravel') return 'MASS-PARTICIPATION'
  if (event.series === 'WTNC2025') return 'GRASSROOTS'
  if (event.series === 'WTNC2024') return 'A'
  if (event.series === 'BCProvincials') return 'AA'
  if (event.series === 'SpringSeries') return 'A'
  if (event.series === 'LMCX2024') return 'A'
  if (event.organizerAlias === 'LocalRide') return 'A'
  if (event.organizerAlias === 'ShimsRide') return 'A'
  if (event.organizerAlias === 'Concord') return 'A'
  if (event.organizerAlias === 'EscapeVelocity' && event.name.includes('Seymour Challenge')) return 'A'

  return false
}

export const getSanctionedEventTypeLabel = (eventType: SanctionedEventType): string => {
  return SANCTIONED_EVENT_TYPES[eventType]
}

export const hasDoubleUpgradePoints = (eventType: SanctionedEventType): boolean => {
  return ['AA', 'AA-USA', 'CYCLING-CANADA'].includes(eventType)
}

export const calculateFieldSize = (eventResults: EventResults, category: string): {
  starters: number,
  categories?: string[]
} => {
  // Check if selected category has been combined with another category
  if (COMBINED_RACE_CATEGORIES[eventResults.hash]) {
    const index = COMBINED_RACE_CATEGORIES[eventResults.hash].findIndex((categories) => categories.includes(category))
    if (index !== -1) {
      // If combined, return the size of the first category in the combined categories
      const combinedCategories = COMBINED_RACE_CATEGORIES[eventResults.hash][index]
      const starters = combinedCategories.reduce((acc, cat) => {
        return acc + (eventResults.results[cat]?.results.filter((result) => result.status !== 'DNS').length || 0)
      }, 0)
      const categories = combinedCategories.map((categoryAlias) => eventResults['results'][categoryAlias]?.label || categoryAlias)
      return { starters, categories }
    }
  }

  // If no combined categories, return the size of the selected category
  const starters = eventResults.results[category]?.results.filter((result) => result.status !== 'DNS').length || 0

  return { starters }
}

export const calculateBCUpgradePoints = ({ position, fieldSize, event }: {
  position: number,
  fieldSize: number,
  event: EventSummary
}): number | null => {
  const eventType = getSanctionedEventType(event)
  const isDouble = eventType && hasDoubleUpgradePoints(eventType)

  // Compare fieldSize with position in BC_UPGRADE_POINT_RULES to get the number of points
  const range = BC_UPGRADE_POINT_RULES.find((rule) => {
    return fieldSize >= rule.fieldSize[0] && fieldSize <= rule.fieldSize[1]
  })?.points

  if (!range) return null

  if (range && range[position - 1]) return range[position - 1] * (isDouble ? 2 : 1)

  return 0
}