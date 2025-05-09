import { useEffect, useState } from 'react'
import { BrowserRouter, NavLink, Route, Routes } from 'react-router'
import '@mantine/core/styles.css'
import './App.css'
import { loadStartupData, type RaceEvent } from './utils/loadStartupData'
import { AppShell, Burger, MantineProvider } from '@mantine/core'
import { Events } from './Events/Events'
import { useDisclosure } from '@mantine/hooks'
import { Event } from './Event/Event'
import { AppContext } from './AppContext'
import type { GroupedEventFile } from './utils/aws-s3'

function App() {
  const [opened, { toggle }] = useDisclosure()
  const [years, setYears] = useState<number[]>([])
  const [events, setEvents] = useState<RaceEvent[]>([])
  const [files, setFiles] = useState<GroupedEventFile[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        const { years, events, files } = await loadStartupData()

        setYears(years)
        setEvents(events)
        setFiles(files)
        setLoading(false)
      } catch (error) {
        console.error(error)
      }
    }

    fetchData()
  }, [])

  return (
    <BrowserRouter>
      <AppContext.Provider value={{ years, events, files, loading }}>
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

            <AppShell.Navbar p="md">
              {/*<NavLink*/}
              {/*  // href="#required-for-focus"*/}
              {/*  label="Events"*/}
              {/*  // leftSection={<IconHome2 size={16} stroke={1.5} />}*/}
              {/*/>*/}
            </AppShell.Navbar>

            <AppShell.Main>
              {!loading && (
                <Routes>
                  <Route path="/" element={<Events/>}/>
                  <Route path="/event/:year/:organizer/:eventName" element={<Event/>}/>
                </Routes>
              )}
            </AppShell.Main>
          </AppShell>
        </MantineProvider>
      </AppContext.Provider>
    </BrowserRouter>
  )
}

export default App
