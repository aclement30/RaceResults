import { useMemo } from 'react'
import type { AggregatedIndividualRanking, AggregatedTeamRanking } from './Serie'

export const useCategoryStandings = (
  standings: Array<AggregatedIndividualRanking | AggregatedTeamRanking>,
  searchValue?: string
) => {
  const sortedStandings = useMemo(() => {
    const standingsWithPosition = standings.filter((result) => result.position > 0)

    let sortedStandings = [...standingsWithPosition].sort((a, b) => a.position - b.position)

    const otherStandings = standings.filter((result) => result.position <= 0)
    sortedStandings = [...sortedStandings, ...otherStandings]

    return sortedStandings
  }, [standings])

  const filteredStandings = useMemo(() => {
    if (!searchValue) return sortedStandings

    const searchValueLower = searchValue.toLowerCase().trim()

    return sortedStandings.filter((standing) => {
      if (isNaN(+searchValueLower)) {
        const { team } = standing
        const { firstName, lastName } = standing as AggregatedIndividualRanking
        const fullName = `${firstName} ${lastName}`.toLowerCase()
        const teamLower = team?.toLowerCase()

        return fullName.includes(searchValueLower) || teamLower?.includes(searchValueLower)
      } else {
        const bibNumber = +searchValueLower
        return (standing as AggregatedIndividualRanking).bibNumber?.toString().startsWith(bibNumber.toString())
      }
    })
  }, [sortedStandings, searchValue])

  const isFiltered = filteredStandings.length !== sortedStandings.length

  return { filteredStandings, sortedStandings, isFiltered }
}

const dateOptions = { month: 'short' as const, day: 'numeric' as const }
const tzOffset = new Date().getTimezoneOffset() / 60 // Timezone offset (hr)

// Transform a local date (eg. 2025-05-20 -> May 20)
export const formatRaceDate = (date: string) => {
  const localDate = new Date(`${date}T00:00:00-0${tzOffset}:00`)
  return localDate.toLocaleDateString('en-CA', dateOptions)
}