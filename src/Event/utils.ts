import { useMemo } from 'react'
import type { EventAthlete, AthleteRaceResult, EventCategory } from '../types/results'

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

const SANCTIONED_EVENT_TYPES = {
  GRASSROOTS: 'Grassroots Race',
  A: 'A-Race',
  AA: 'AA-Race',
  'AA-USA': 'AA-USA',
  'CYCLING-CANADA': 'Cycling Canada',
  'MASS-PARTICIPATION': 'Mass Participation Race',
}

type SanctionedEventType = keyof typeof SANCTIONED_EVENT_TYPES

export const getSanctionedEventTypeLabel = (eventType: SanctionedEventType | null): string => {
  if (!eventType || !SANCTIONED_EVENT_TYPES[eventType]) return 'Unknown'

  return SANCTIONED_EVENT_TYPES[eventType]
}

export const hasDoubleUpgradePoints = (eventType: SanctionedEventType): boolean => {
  return ['AA', 'AA-USA', 'CYCLING-CANADA'].includes(eventType)
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
  switch (serieAlias) {
    case 'BCProvincials':
      return 'BC Provincials'
    case 'SpringSeries':
      return 'Spring Series'
    case 'TourDeBloom':
      return 'Tour de Bloom'
    default:
      return serieAlias || undefined
  }
}