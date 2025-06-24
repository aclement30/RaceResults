import { useNavigate } from 'react-router'

export const useNavigator = () => {
  const navigate = useNavigate()

  const navigateToTeam = (teamId: number) => {
    navigate(`/teams/${teamId}`)
  }

  const navigateToAthlete = (athleteUciId: string, tab?: string) => {
    navigate(`/athletes/${athleteUciId}` + (tab ? `?tab=${tab}` : ''))
  }

  const navigateToEvents = () => {
    navigate('/events')
  }

  return {
    navigateToAthlete,
    navigateToTeam,
    navigateToEvents,
  }
}