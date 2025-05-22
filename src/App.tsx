import { useEffect, useState } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router'
import '@mantine/core/styles.css'
import './App.css'
import { loadStartupData, type BaseEvent } from './utils/loadStartupData'
import { AppShell, Burger, LoadingOverlay, MantineProvider } from '@mantine/core'
import { Events } from './Events/Events'
import { useDisclosure } from '@mantine/hooks'
import { Event } from './Event/Event'
import { AppContext } from './AppContext'
import type { CrossMgrEventSourceFiles } from './types/CrossMgr'

function App() {
  const [opened, { toggle }] = useDisclosure()
  const [years, setYears] = useState<number[]>([])
  const [events, setEvents] = useState<Map<number, BaseEvent[]>>(new Map<number, BaseEvent[]>())
  const [sourceFiles, setSourceFiles] = useState<Map<number, CrossMgrEventSourceFiles>>(new Map<number, CrossMgrEventSourceFiles>())
  const [loading, setLoading] = useState<boolean>(true)

  const setEventsForYear = async (events: BaseEvent[], year: number) => {
    setEvents((prevState) => ( new Map(prevState).set(year, events) ))
  }

  const setSourceFilesForYear = async (sourceFiles: CrossMgrEventSourceFiles, year: number) => {
    setSourceFiles((prevState) => ( new Map(prevState).set(year, sourceFiles) ))
  }

  console.log({ events })

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        const { years } = await loadStartupData()

        setYears(years)
        setLoading(false)
      } catch (error) {
        console.error(error)
      }
    }

    fetchData()
  }, [])

  return (
    <BrowserRouter>
      <AppContext.Provider
        value={{ years, setYears, events, setEventsForYear, sourceFiles, setSourceFilesForYear, loading, setLoading }}>
        <MantineProvider>
          <AppShell
            header={{ height: 60 }}
            navbar={{
              width: 300,
              breakpoint: 'sm',
              collapsed: { mobile: !opened },
            }}
            padding="md"
          >
            <AppShell.Header>
              <Burger
                opened={opened}
                onClick={toggle}
                hiddenFrom="sm"
                size="sm"
              />
              <h1 style={{ margin: '5px 20px 0' }}>Race Results</h1>
            </AppShell.Header>

            <LoadingOverlay visible={loading} loaderProps={{ children: 'Loading events...' }}/>

            {!loading && (
              <Routes>
                <Route path="/" element={<Events/>}/>
                <Route path="/events" element={<Events/>}/>
                <Route path="/events/:year/:hash" element={<Event/>}/>
                <Route path="/events/:year/:hash/:selectedCategory" element={<Event/>}/>
              </Routes>
            )}
          </AppShell>
        </MantineProvider>
      </AppContext.Provider>
    </BrowserRouter>
  )
}

export default App
