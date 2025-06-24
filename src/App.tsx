import { useCallback, useEffect, useState } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router'
import '@mantine/core/styles.css'
import '@mantine/notifications/styles.css'
import './App.css'
import { loadStartupData } from './utils/loadStartupData'
import { AppShell, createTheme, LoadingOverlay, MantineProvider } from '@mantine/core'
import { Events } from './Events/Events'
import { useDisclosure } from '@mantine/hooks'
import { Event } from './Event/Event'
import { AppContext } from './AppContext'
import type { EventSummary, SerieSummary } from './types/results'
import { Serie } from './Serie/Serie'
import { Header } from './Header/Header'
import { Loader } from './Loader/Loader'
import { Notifications } from '@mantine/notifications'
import type { Athlete } from './types/athletes'
import { Athlete as AthleteComponent } from './Athlete/Athlete'
import { Team as TeamComponent } from './Team/Team'
import type { Team } from './types/team'
import { Athletes } from './Athletes/Athletes'

const theme = createTheme({
  cursorType: 'pointer',
})

function App() {
  const [opened, { toggle: toggleNavbar, close: closeNavbar }] = useDisclosure()
  const [years, setYears] = useState<number[]>([])
  const [athletes, setAthletes] = useState<Map<string, Athlete>>(new Map<string, Athlete>())
  const [teams, setTeams] = useState<Map<number, Team>>(new Map<number, Team>())
  const [athleteLookupTable, setAthleteLookupTable] = useState<Map<string, string>>(new Map<string, string>())
  const [favoriteAthletes, setFavoriteAthletes] = useState<string[]>([])
  const [favoriteTeams, setFavoriteTeams] = useState<number[]>([])
  const [events, setAllEvents] = useState<Map<number, EventSummary[]>>(new Map<number, EventSummary[]>())
  const [series, setAllSeries] = useState<Map<number, SerieSummary[]>>(new Map<number, SerieSummary[]>())
  const [loading, setLoading] = useState<boolean>(true)
  const [loadingStartupData, setLoadingStartupData] = useState<boolean>(true)

  const setEvents = useCallback(async (events: EventSummary[], year: number) => {
    setAllEvents((prevState) => (new Map(prevState).set(year, events)))
  }, [setAllEvents])

  const setSeries = useCallback(async (series: SerieSummary[], year: number) => {
    setAllSeries((prevState) => (new Map(prevState).set(year, series)))
  }, [setAllSeries])

  const findTeam = useCallback((o: { id?: number, name?: string }): Team | null => {
    if (o.id) return teams.get(o.id) || null
    if (o.name) {
      for (let [, team] of teams.entries()) {
        if (team.name.toLowerCase() === o.name.toLowerCase()) {
          return team
        }
      }
    }
    return null
  }, [teams])

  const findAthlete = useCallback((params: {
    firstName?: string,
    lastName?: string,
    uciId?: string
  }): Athlete | null => {
    if ('uciId' in params && params.uciId) return athletes.get(params.uciId) || null

    const uciId = athleteLookupTable.get(`${params.firstName?.toLowerCase()}|${params.lastName?.toLowerCase()}`)
    if (uciId) return athletes.get(uciId) || null

    return null
  }, [athletes, athleteLookupTable])

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingStartupData(true)

        const { athletes, lookupTable, teams, years, favoriteAthletes, favoriteTeams } = await loadStartupData()

        setAthletes(new Map(Object.entries(athletes)))
        setAthleteLookupTable(new Map(Object.entries(lookupTable)))
        setTeams(new Map(Object.entries(teams).map(([id, team]) => [+id, team])))
        setFavoriteAthletes(favoriteAthletes)
        setFavoriteTeams(favoriteTeams)
        setYears(years)
        setLoadingStartupData(false)
      } catch (error) {
        console.error(error)
      }
    }

    fetchData()
  }, [])

  return (
    <BrowserRouter>
      <AppContext.Provider
        value={{
          athletes,
          findAthlete,
          teams,
          findTeam,
          years,
          setYears,
          favoriteAthletes,
          toggleFavoriteAthlete,
          favoriteTeams,
          toggleFavoriteTeam,
          events,
          setEvents,
          series,
          setSeries,
          loading,
          setLoading,
          isNavbarOpened: opened,
          toggleNavbar,
          closeNavbar,
        }}>
        <MantineProvider theme={theme}>
          <Notifications/>

          <AppShell
            header={{ height: 60 }}
            navbar={{
              width: 300,
              breakpoint: 'md',
              collapsed: { mobile: !opened },
            }}
            padding="md"
          >
            <Header/>

            <LoadingOverlay
              visible={loadingStartupData} overlayProps={{ radius: 'sm', blur: 2 }}
              loaderProps={{
                children: <Loader text="Loading events..."/>,
              }}
            />

            {!loadingStartupData && (
              <Routes>
                <Route path="/" element={<Events/>}/>
                <Route path="/events" element={<Events/>}/>
                <Route path="/events/:year/:hash" element={<Event/>}/>
                <Route path="/series/:year/:hash/:resultType" element={<Serie/>}/>
                <Route path="/athletes/list/:list" element={<Athletes/>}/>
                <Route path="/athletes/:uciId" element={<AthleteComponent/>}/>
                <Route path="/teams/:teamId" element={<TeamComponent/>}/>
              </Routes>
            )}
          </AppShell>
        </MantineProvider>
      </AppContext.Provider>
    </BrowserRouter>
  )
}

export default App
