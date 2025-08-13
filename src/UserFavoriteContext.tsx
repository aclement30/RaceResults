import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from 'react'
import { AppContext } from './AppContext'

export const UserFavoriteContext = createContext({
  favoriteAthletes: [] as string[],
  favoriteTeams: [] as number[],
  isFavorite: (_: { athleteUciId?: string, team?: string }): boolean => { return false },
  toggleFavoriteAthlete: (_: string) => {},
  toggleFavoriteTeam: (_: number) => {},
})

export const UserFavoriteContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { findTeam } = useContext(AppContext)
  const [favoriteAthletes, setFavoriteAthletes] = useState<string[]>([])
  const [favoriteTeams, setFavoriteTeams] = useState<number[]>([])

  const toggleFavoriteAthlete = useCallback((athleteUciId: string) => {
    setFavoriteAthletes((prevFavorites) => {
      let updatedFavorites = [...prevFavorites]

      if (prevFavorites.includes(athleteUciId)) {
        updatedFavorites = updatedFavorites.filter(id => id !== athleteUciId)
      } else {
        updatedFavorites = [...updatedFavorites, athleteUciId]
      }

      localStorage.setItem('favorite-athletes', JSON.stringify(updatedFavorites))

      return updatedFavorites
    })
  }, [setFavoriteAthletes])

  const toggleFavoriteTeam = useCallback((teamId: number) => {
    setFavoriteTeams((prevFavorites) => {
      let updatedFavorites = [...prevFavorites]

      if (prevFavorites.includes(teamId)) {
        updatedFavorites = updatedFavorites.filter(id => id !== teamId)
      } else {
        updatedFavorites = [...updatedFavorites, teamId]
      }

      localStorage.setItem('favorite-teams', JSON.stringify(updatedFavorites))

      return updatedFavorites
    })
  }, [setFavoriteTeams])

  const isFavorite = useCallback(({ athleteUciId, team: teamName }: { athleteUciId?: string, team?: string }) => {
    if (athleteUciId && favoriteAthletes.includes(athleteUciId)) return true

    if (teamName) {
      const team = findTeam({ name: teamName })
      return !!team && favoriteTeams.includes(team.id)
    }

    return false
  }, [favoriteAthletes, favoriteTeams])

  useEffect(() => {
    const favoriteAthletesString = localStorage.getItem('favorite-athletes')
    setFavoriteAthletes(favoriteAthletesString ? JSON.parse(favoriteAthletesString) : [])

    const favoriteTeamsString = localStorage.getItem('favorite-teams')
    setFavoriteTeams(favoriteTeamsString ? JSON.parse(favoriteTeamsString) : [])
  }, [setFavoriteAthletes, setFavoriteTeams])

  const value = {
    favoriteAthletes,
    favoriteTeams,
    isFavorite,
    toggleFavoriteAthlete,
    toggleFavoriteTeam,
  }

  return (
    <UserFavoriteContext.Provider value={value}>
      {children}
    </UserFavoriteContext.Provider>
  )
}