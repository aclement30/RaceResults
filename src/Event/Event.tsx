import { useContext, useEffect, useMemo, useState } from 'react'
import { AppContext } from '../AppContext'
import { useParams, useSearchParams } from 'react-router'
import type { EventResults, EventSummary } from '../types/results'
import { ResultsTable } from './ResultsTable/ResultsTable'
import { AppShell, TextInput, Text, Divider, Tabs, LoadingOverlay, Anchor, Blockquote } from '@mantine/core'
import { IconCoins, IconRotateClockwise, IconTrophy } from '@tabler/icons-react'
import { EventHeader } from './EventHeader/EventHeader'
import { LapsTable } from './LapsTable/LapsTable'
import { PrimesTable } from './PrimesTable/PrimesTable'
import { useCategoryResults } from './utils'
import { fetchEventResults, fetchEventsAndSeries, validateYear } from '../utils/aws-s3'
import { Navbar } from './Navbar/Navbar'

export const Event: React.FC = () => {
  const { events, loading, setLoading, setEvents, setSeries } = useContext(AppContext)
  const [eventSummary, setEventSummary] = useState<EventSummary | null>(null)
  const [eventResults, setEventResults] = useState<EventResults | null>(null)
  const [searchValue, setSearchValue] = useState('')
  const [loadingResults, setLoadingResults] = useState<boolean>(true)

  const params = useParams()
  const { year, hash } = params
  const eventYear = +year!
  const eventHash = hash!

  const [searchParams, setSearchParams] = useSearchParams()
  const selectedCategory = searchParams.get('category') || eventSummary?.categories[0].alias
  const selectedTab = searchParams.get('tab') || 'results'

  const selectedEvent = useMemo(() => events.get(eventYear)?.find(({ hash }) => hash === eventHash), [events, params])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        if (!validateYear(eventYear)) throw new Error('Invalid year:' + eventYear)

        const { events, series } = await fetchEventsAndSeries(eventYear)

        setEvents(events, eventYear)
        setSeries(series, eventYear)
        setLoading(false)
      } catch (error) {
        console.error(error)
      }
    }

    if (!events.get(eventYear)) {
      fetchData()
    }
  }, [eventYear])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingResults(true)

        const eventSummary = events.get(eventYear)?.find(({ hash }) => hash === eventHash)

        if (!eventSummary) throw new Error('No event found!')

        setEventSummary(eventSummary)

        const eventResults = await fetchEventResults(eventYear, eventHash)

        setEventResults(eventResults)

        setLoadingResults(false)
      } catch (error) {
        console.log(error)
      }
    }

    if (events.get(eventYear)) {
      fetchData()
    }
  }, [eventHash, events])

  const selectedEventCategory = !!selectedCategory && eventResults?.results[selectedCategory] || undefined

  const {
    sortedResults,
    filteredResults,
    isFiltered
  } = useCategoryResults(selectedEventCategory?.results || [], eventResults?.athletes || {}, searchValue)

  const handleTabChamge = (tab: string | null) => {
    if (!tab) {
      setSearchParams(new URLSearchParams({ category: selectedEventCategory!.alias }))
    } else {
      setSearchParams(new URLSearchParams({ category: selectedEventCategory!.alias, tab }))
    }
  }

  if (!selectedEvent) {
    return ( 'NO EVENT FOUND' )
  }

  return (
    <>
      <LoadingOverlay visible={loading} loaderProps={{ children: 'Loading event...' }}/>

      <Navbar eventYear={eventYear} eventHash={eventHash} selectedCategory={selectedCategory}
              categories={eventSummary?.categories}/>

      <AppShell.Main>
        <LoadingOverlay visible={loadingResults} loaderProps={{ children: 'Loading results...' }}/>

        {eventSummary && ( <EventHeader event={eventSummary}/> )}

        <Divider my="md"/>

        {eventResults && (
          <>
            <div style={{ paddingBottom: '1rem' }}>
              <TextInput
                placeholder="Search participant name, team, bib number..."
                value={searchValue}
                onChange={(event) => setSearchValue(event.currentTarget.value)}
              />
            </div>

            <Tabs value={selectedTab} onChange={handleTabChamge}>
              <Tabs.List>
                <Tabs.Tab value="results" leftSection={<IconTrophy/>}>
                  Results
                </Tabs.Tab>
                {!!selectedEventCategory?.primes.length && (
                  <Tabs.Tab value="primes" leftSection={<IconCoins/>}>
                    Primes
                  </Tabs.Tab>
                )}
                {selectedEventCategory?.laps && selectedEventCategory?.laps > 1 && (
                  <Tabs.Tab value="laps" leftSection={<IconRotateClockwise/>}>
                    Laps
                  </Tabs.Tab>
                )}
              </Tabs.List>

              <Tabs.Panel value="results">
                <ResultsTable
                  results={filteredResults}
                  athletes={eventResults.athletes}
                  isFiltered={isFiltered}
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

            <Divider/>

            {eventResults.raceNotes && (
              <>
                <Blockquote color="gray" mt="lg" p="md">
                  <div dangerouslySetInnerHTML={{ __html: eventResults.raceNotes }} style={{ fontSize: 'smaller' }}/>
                </Blockquote>

                <Divider/>
              </>
            )}

            <Text c="dimmed" size="sm" style={{ padding: '1rem 10px 1rem' }}>
              Last Updated: {new Date(eventResults.lastUpdated).toLocaleDateString('en-CA', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            })}
            </Text>

            <Divider/>

            {!!eventResults.sourceUrls?.length && ( <>
              <Text c="dimmed" size="sm" style={{ padding: '10px 10px 0' }}>Source:</Text>
              <ul style={{ listStyle: 'inside', listStyleType: '-', margin: 0, paddingLeft: 10 }}>
                {eventResults.sourceUrls?.map((url) =>
                  <li key={url}><Anchor href={url} target="_blank" size="sm">{url}</Anchor>
                  </li>
                )}
              </ul>
            </> )}
          </>
        )}
      </AppShell.Main>
    </>
  )
}