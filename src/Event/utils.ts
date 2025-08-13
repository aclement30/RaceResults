import { useMemo } from 'react'
import type { EventAthlete, AthleteRaceResult, EventCategory } from '../types/results'
import { BC_SANCTIONED_EVENT_TYPES } from '../config/event-types'
import { SERIES } from '../config/series'

export const useCategoryResults = (
  results: AthleteRaceResult[], athletes: Record<string, EventAthlete>,
  searchValue?: string
) => {
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
        const { firstName, lastName, team } = athletes[raceResult.athleteId]
        const fullName = `${firstName} ${lastName}`.toLowerCase()
        const teamLower = team?.toLowerCase()

        return fullName.includes(searchValueLower) || teamLower?.includes(searchValueLower)
      } else {
        const bibNumber = +searchValueLower
        return raceResult.bibNumber?.toString().startsWith(bibNumber.toString())
      }
    })
  }, [sortedResults, searchValue])

  const isFiltered = filteredResults.length !== sortedResults.length

  return { filteredResults, sortedResults, isFiltered }
}

type SanctionedEventType = keyof typeof BC_SANCTIONED_EVENT_TYPES

export const getSanctionedEventTypeLabel = (eventType: SanctionedEventType | null): string => {
  if (!eventType || !BC_SANCTIONED_EVENT_TYPES[eventType]) return 'Unknown'

  return BC_SANCTIONED_EVENT_TYPES[eventType]
}

export const hasDoubleUpgradePoints = (eventType: SanctionedEventType): boolean => {
  return ['AA', 'AAA', 'AA-USA'].includes(eventType)
}

export const getCategoriesWithLabels = (
  categories: string[] | null | undefined,
  allEventCategories: Record<string, EventCategory>
): Record<string, string> => {
  if (!categories || !allEventCategories) return {}

  return categories.reduce((acc, alias) => {
    const category = allEventCategories[alias]
    acc[alias] = category?.label || alias
    return acc
  }, {} as Record<string, string>)
}

export const getSerieLabel = (serieAlias: string | null | undefined): string | undefined => {
  if (serieAlias && SERIES[serieAlias]) return SERIES[serieAlias]

  return serieAlias || undefined
}