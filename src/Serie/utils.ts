import { useMemo } from 'react'
import type { AthleteSerieResult, TeamSerieResult } from '../types/results'

export const useCategoryResults = (results: Array<AthleteSerieResult | TeamSerieResult>, searchValue?: string) => {
  const sortedResults = useMemo(() => {
    const resultsWithPosition = results.filter((result) => result.position > 0)

    let sortedResults = [...resultsWithPosition].sort((a, b) => a.position - b.position)

    const otherResults = results.filter((result) => result.position <= 0)
    sortedResults = [...sortedResults, ...otherResults]

    return sortedResults
  }, [results])

  const filteredResults = useMemo(() => {
    if (!searchValue) return sortedResults

    const searchValueLower = searchValue.toLowerCase().trim()

    return sortedResults.filter((seriesResult) => {
      if (isNaN(+searchValueLower)) {
        const { team } = seriesResult
        const { firstName, lastName } = seriesResult as AthleteSerieResult
        const fullName = `${firstName} ${lastName}`.toLowerCase()
        const teamLower = team?.toLowerCase()

        return fullName.includes(searchValueLower) || teamLower?.includes(searchValueLower)
      } else {
        const bibNumber = +searchValueLower
        return ( seriesResult as AthleteSerieResult ).bibNumber?.toString().startsWith(bibNumber.toString())
      }
    })
  }, [sortedResults, searchValue])

  const isFiltered = filteredResults.length !== sortedResults.length

  return { filteredResults, sortedResults, isFiltered }
}

const dateOptions = { month: 'short' as const, day: 'numeric' as const }
const tzOffset = new Date().getTimezoneOffset() / 60 // Timezone offset (hr)

// Transform a local date (eg. 2025-05-20 -> May 20)
export const formatRaceDate = (date: string) => {
  const localDate = new Date(`${date}T00:00:00-0${tzOffset}:00`)
  return localDate.toLocaleDateString('en-CA', dateOptions)
}