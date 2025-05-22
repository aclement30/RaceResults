import type { Athlete, AthleteRaceResult } from '../types/results'
import { useMemo } from 'react'

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