import { useContext, useEffect } from 'react'
import { Route, Routes } from 'react-router'
import { loadStartupData } from '../utils/loadStartupData'
import { AppShell, LoadingOverlay } from '@mantine/core'
import { Events } from '../Events/Events'
import { Event } from '../Event/Event'
import { AppContext } from '../AppContext'
import { Serie } from '../Serie/Serie'
import { Header } from '../Header/Header'
import { Loader } from '../Loader/Loader'
import { Athlete as AthleteComponent } from '../Athlete/Athlete'
import { Team as TeamComponent } from '../Team/Team'
import { Athletes } from '../Athletes/Athletes'
import { QuickTips } from '../Shared/QuickTips/QuickTips'
import { UIContext } from '../UIContext'
import { UserFavoriteContextProvider } from '../UserFavoriteContext'

export const Public = () => {
  const { isNavbarOpened } = useContext(UIContext)
  const {
    loadingStartupData,
    setLoadingStartupData,
    setAthletes,
    setTeams,
    setAthleteLookupTable,
    setYears,
  } = useContext(AppContext)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingStartupData(true)

        const { athletes, lookupTable, teams, years } = await loadStartupData()

        setAthletes(new Map(Object.entries(athletes)))
        setAthleteLookupTable(new Map(Object.entries(lookupTable)))
        setTeams(new Map(Object.entries(teams).map(([id, team]) => [+id, team])))
        setYears(years)

        setLoadingStartupData(false)
      } catch (error) {
        console.error(error)
      }
    }

    fetchData()
  }, [])

  return (
    <UserFavoriteContextProvider>
      <AppShell
        header={{ height: 60 }}
        navbar={{
          width: 300,
          breakpoint: 'md',
          collapsed: { mobile: !isNavbarOpened },
        }}
        padding="md"
      >
        <QuickTips/>

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
    </UserFavoriteContextProvider>
  )
}