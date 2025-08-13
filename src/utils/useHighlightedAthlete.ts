import { useSearchParams } from 'react-router'
import { useMemo } from 'react'

export const useHighlightedAthlete = () => {
  const [searchParams, setSearchParams] = useSearchParams()

  const highlightedBibNumber = useMemo(() => searchParams.get('highlight'), [searchParams])

  const highlightAthlete = (bibNumber: number) => {
    const updatedParams = new URLSearchParams(searchParams)

    if (highlightedBibNumber && +highlightedBibNumber === bibNumber) {
      updatedParams.delete('highlight')
    } else {
      updatedParams.set('highlight', bibNumber.toString())
    }

    setSearchParams(updatedParams)
  }

  return {
    highlightedBibNumber,
    highlightAthlete,
  }
}