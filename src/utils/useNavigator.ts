import { useNavigate } from 'react-router'

export const useNavigator = () => {
  const navigate = useNavigate()

  const navigateToTeam = (teamId: number) => {
    navigate(`/teams/${teamId}`)
  }

  const navigateToAthlete = (athleteUciId: string) => {
    navigate(`/athletes/${athleteUciId}`)
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