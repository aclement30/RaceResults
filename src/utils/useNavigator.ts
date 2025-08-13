import { useNavigate, useSearchParams } from 'react-router'

export const useNavigator = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const navigateToTeam = (teamId: number) => {
    navigate(`/teams/${teamId}`)
  }

  const navigateToAthlete = (athleteUciId: string, tab?: string) => {
    navigate(`/athletes/${athleteUciId}` + (tab ? `?tab=${tab}` : ''))
  }

  const navigateToEvents = () => {
    navigate('/events')
  }

  const navigateToEvent = (event: { hash: string, year: number }, category?: string) => {
    navigate(`/events/${event.year}/${event.hash}?category=${category}`)
  }

  const navigateToSerie = (serie: { hash: string, year: number }, params?: { category?: string, team?: string }) => {
    const updatedParams = new URLSearchParams(searchParams)

    if (params) {
      if (params.team) updatedParams.set('team', params.team)
      if (params.category) updatedParams.set('category', params.category)
    }

    navigate(`/series/${serie.year}/${serie.hash}/individual?${updatedParams.toString()}`)
  }

  return {
    navigateToAthlete,
    navigateToTeam,
    navigateToEvents,
    navigateToEvent,
    navigateToSerie,
  }
}