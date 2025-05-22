import { useContext, useEffect, useMemo, useState } from 'react'
import { AppContext } from '../AppContext'
import { useNavigate, useParams, NavLink as RouterNavLink } from 'react-router'
import { getFullEventWithResults } from '../utils/race-results'
import type { EventInfo, EventStats } from '../types/results'
import { CategoryResultsTable } from './CategoryResultsTable/CategoryResultsTable'
import { AppShell, Button, NavLink, TextInput, Divider, Tabs } from '@mantine/core'
import cx from 'clsx'
import { IconArrowLeft } from '@tabler/icons-react'
import { EventHeader } from './EventHeader/EventHeader'
import { LapsTable } from './LapsTable/LapsTable'
import { PrimesTable } from './PrimesTable/PrimesTable'
import { useCategoryResults } from './utils'
import { fetchEventsAndSeriesForYear } from '../utils/aws-s3'

export const Event: React.FC = () => {
  const { events, sourceFiles: allFiles, setLoading, setEventsForYear, setSourceFilesForYear } = useContext(AppContext)
  const [eventInfo, setEventInfo] = useState<EventInfo | null>(null)
  const [eventResults, setEventResults] = useState<EventStats | null>(null)
  const [searchValue, setSearchValue] = useState('')

  const params = useParams()
  const { selectedCategory: selectedCategoryAlias } = params
  const navigate = useNavigate()

  const selectedEvent = useMemo(() => events.get(+params.year!)?.find(({ hash }) => hash === params.hash!), [events, params])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        const { events, sourceFiles } = await fetchEventsAndSeriesForYear(+params.year!)

        setEventsForYear(events, +params.year!)
        // setSeriesForYear(series, year)
        setSourceFilesForYear(sourceFiles, +params.year!)
        setLoading(false)
      } catch (error) {
        console.error(error)
      }
    }

    if (!events.get(+params.year!)) {
      fetchData()
    }
  }, [params.year, setLoading, setEventsForYear])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const baseEvent = events.get(+params.year!)?.find(({ hash }) => hash === params.hash!)
        const sourceFiles = allFiles.get(+params.year!)?.[params.hash!]

        if (!baseEvent) throw new Error('No event found!')
        if (!sourceFiles) throw new Error('No source files found for this event!')

        const { eventInfo, results } = await getFullEventWithResults(baseEvent, sourceFiles)

        setEventInfo(eventInfo)
        setEventResults(results)
      } catch (error) {
        console.log(error)
      }
    }

    if (events.get(+params.year!) && allFiles.get(+params.year!)) {
      fetchData()
    }
  }, [params.hash, events, allFiles])

  const selectedEventCategory = !!selectedCategoryAlias && eventResults?.results[selectedCategoryAlias] || null

  const {
    sortedResults,
    filteredResults,
    isFiltered
  } = useCategoryResults(selectedEventCategory?.results || [], eventResults?.athletes || {}, searchValue)

  if (!selectedCategoryAlias && eventResults?.categories.length) {
    navigate(`/events/${params.year}/${params.hash}/${eventResults.categories[0].alias}`)
  }

  if (!selectedEvent) {
    return ( 'NO EVENT FOUND' )
  }

  // @ts-ignore
  return (
    <>
      <AppShell.Navbar p="md">
        <Button
          variant="subtle"
          leftSection={<IconArrowLeft size={14}/>}
          style={{ marginBottom: 20 }}
          onClick={() => navigate('/events?year=' + params.year!)}
        >
          Back to events list
        </Button>

        {eventResults?.categories.map((cat) => (
          <NavLink
            key={cat.alias}
            renderRoot={({ className, ...others }) => (
              <RouterNavLink
                to={`/events/${params.year}/${params.hash}/${cat.alias}`}
                className={({ isActive }) =>
                  cx(className, { 'active-class': isActive })
                }
                {...others}
              />
            )}
            label={cat.label}
          />
        ))}
      </AppShell.Navbar>

      <AppShell.Main>
        {eventInfo && ( <EventHeader event={eventInfo}/> )}

        <Divider my="md"/>

        {eventResults && (
          <>
            <div style={{ padding: 10 }}>
              <TextInput
                placeholder="Search participant name, team, bib number..."
                value={searchValue}
                onChange={(event) => setSearchValue(event.currentTarget.value)}
              />
            </div>

            <Tabs defaultValue="ranking">
              <Tabs.List>
                <Tabs.Tab value="ranking">
                  Ranking
                </Tabs.Tab>
                {!!selectedEventCategory?.primes.length && (
                  <Tabs.Tab value="primes">
                    Primes
                  </Tabs.Tab>
                )}
                {selectedEventCategory!.laps < 1 && (
                  <Tabs.Tab value="laps">
                    Laps
                  </Tabs.Tab>
                )}
              </Tabs.List>

              <Tabs.Panel value="ranking">
                <CategoryResultsTable
                  results={filteredResults}
                  athletes={eventResults.athletes}
                />
              </Tabs.Panel>

              <Tabs.Panel value="primes">
                <PrimesTable primes={selectedEventCategory?.primes || []} athletes={eventResults.athletes}/>
              </Tabs.Panel>

              <Tabs.Panel value="laps">
                <LapsTable lapCount={selectedEventCategory?.laps || 0}
                           sortedResults={sortedResults}
                           filteredResults={filteredResults}
                           athletes={eventResults.athletes}/>
              </Tabs.Panel>
            </Tabs>
          </>
        )}
      </AppShell.Main>
    </>
  )
}