import { useCallback, useEffect, useState } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router'
import '@mantine/core/styles.css'
import './App.css'
import { loadStartupData } from './utils/loadStartupData'
import { AppShell, Burger, Group, LoadingOverlay, MantineProvider } from '@mantine/core'
import { Events } from './Events/Events'
import { useDisclosure } from '@mantine/hooks'
import { Event } from './Event/Event'
import { AppContext } from './AppContext'
import type { EventSummary, SerieSummary } from './types/results'
import { Serie } from './Serie/Serie'

function App() {
  const [opened, { toggle: toggleNavbar, close: closeNavbar }] = useDisclosure()
  const [years, setYears] = useState<number[]>([])
  const [events, setAllEvents] = useState<Map<number, EventSummary[]>>(new Map<number, EventSummary[]>())
  const [series, setAllSeries] = useState<Map<number, SerieSummary[]>>(new Map<number, SerieSummary[]>())
  const [loading, setLoading] = useState<boolean>(true)
  const [loadingStartupData, setLoadingStartupData] = useState<boolean>(true)

  const setEvents = useCallback(async (events: EventSummary[], year: number) => {
    setAllEvents((prevState) => ( new Map(prevState).set(year, events) ))
  }, [setAllEvents])

  const setSeries = useCallback(async (series: SerieSummary[], year: number) => {
    setAllSeries((prevState) => ( new Map(prevState).set(year, series) ))
  }, [setAllSeries])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingStartupData(true)

        const { years } = await loadStartupData()

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
          years,
          setYears,
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
        <MantineProvider>
          <AppShell
            header={{ height: 60 }}
            navbar={{
              width: 300,
              breakpoint: 'md',
              collapsed: { mobile: !opened },
            }}
            footer={{ height: 32 }}
            padding="md"
          >
            <AppShell.Header
              style={{
                backgroundImage: 'url(/header-bg.png)',
                backgroundPosition: 'top right',
                backgroundRepeat: 'no-repeat',
              }}>
              <Group h="100%" px="md">
                <Burger
                  opened={opened}
                  onClick={toggleNavbar}
                  hiddenFrom="md"
                  size="sm"
                />

                <h2 style={{ margin: 0, fontStyle: 'oblique' }}>BC Race Results</h2>
              </Group>
            </AppShell.Header>

            <LoadingOverlay visible={loadingStartupData} loaderProps={{ children: 'Loading events...' }}/>

            {!loadingStartupData && (
              <Routes>
                <Route path="/" element={<Events/>}/>
                <Route path="/events" element={<Events/>}/>
                <Route path="/events/:year/:hash" element={<Event/>}/>
                <Route path="/series/:year/:hash/:resultType" element={<Serie/>}/>
              </Routes>
            )}
          </AppShell>
        </MantineProvider>
      </AppContext.Provider>
    </BrowserRouter>
  )
}

export default App
