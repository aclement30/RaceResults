import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { AppContext } from '../AppContext'
import { useParams, useSearchParams } from 'react-router'
import type { EventResults, EventSummary } from '../types/results'
import { ResultsTable } from './ResultsTable/ResultsTable'
import { AppShell, Text, Divider, Tabs, LoadingOverlay, Blockquote } from '@mantine/core'
import { IconCoins, IconRotateClockwise, IconTrophy } from '@tabler/icons-react'
import { EventHeader } from './EventHeader/EventHeader'
import { LapsTable } from './LapsTable/LapsTable'
import { PrimesTable } from './PrimesTable/PrimesTable'
import { useCategoryResults } from './utils'
import { FETCH_ERROR_TYPE, FetchError, fetchEventResults } from '../utils/aws-s3'
import { Navbar } from './Navbar/Navbar'
import { useEventsAndSeries } from '../utils/useEventsAndSeries'
import { Source } from './Shared/Source'
import { SearchField } from './Shared/SearchField'

export const Event: React.FC = () => {
  const { events, loading } = useContext(AppContext)
  const [eventSummary, setEventSummary] = useState<EventSummary | null>(null)
  const [eventResults, setEventResults] = useState<EventResults | null>(null)
  const eventResultsLastModifiedRef = useRef<Date | null>(null)
  const [searchValue, setSearchValue] = useState('')
  const [loadingResults, setLoadingResults] = useState<boolean>(true)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const params = useParams()
  const { year, hash } = params
  const eventYear = +year!
  const eventHash = hash!

  const [searchParams, setSearchParams] = useSearchParams()
  const selectedCategory = searchParams.get('category') || eventSummary?.categories[0].alias
  const selectedTab = searchParams.get('tab') || 'results'

  const selectedEvent = useMemo(() => events.get(eventYear)?.find(({ hash }) => hash === eventHash), [events, params])

  useEventsAndSeries(eventYear)

  const fetchData = useCallback(async (year: number, hash: string) => {
    if (timerRef.current) clearTimeout(timerRef.current)

    try {
      setLoadingResults(true)

      console.log(`Fetching event results for: ${year}/${hash}`)

      const {
        eventResults,
        lastModified
      } = await fetchEventResults(year, hash, eventResultsLastModifiedRef.current)

      setEventResults(eventResults)
      eventResultsLastModifiedRef.current = lastModified

      timerRef.current = setTimeout(() => {
        fetchData(year, hash)
      }, 1000 * 30) // Refresh every minute
    } catch (error) {
      if (error instanceof FetchError && error.type === FETCH_ERROR_TYPE.NotModified) {
        // If the results file is not modified, we can skip updating
        return
      }

      console.log(error)
    } finally {
      setLoadingResults(false)
    }
  }, [setLoadingResults])

  // Cleanup timer on unmount
  useEffect(() => {
    return function cleanup() {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  useEffect(() => {
    if (events.get(eventYear)) {
      const eventSummary = events.get(eventYear)?.find(({ hash }) => hash === eventHash)
      if (!eventSummary) throw new Error('No event found!')

      setEventSummary(eventSummary)

      fetchData(eventYear, eventHash)
    }
  }, [eventYear, eventHash, events])

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
      <LoadingOverlay visible={loading && !events.get(eventYear)} loaderProps={{ children: 'Loading event...' }}/>

      <Navbar eventYear={eventYear} eventHash={eventHash} selectedCategory={selectedCategory}
              categories={eventSummary?.categories}/>

      <AppShell.Main>
        <LoadingOverlay visible={loadingResults} loaderProps={{ children: 'Loading results...' }}/>

        {eventSummary && ( <EventHeader event={eventSummary}/> )}

        <Divider my="md"/>

        {eventResults && (
          <>
            <div style={{ paddingBottom: '1rem' }}>
              <SearchField value={searchValue} onChange={setSearchValue}/>
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

            <Text c="dimmed" size="sm" style={{ padding: '1rem 0' }}>
              Last Updated: {new Date(eventResults.lastUpdated).toLocaleDateString('en-CA', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            })}
            </Text>

            <Divider/>

            <Source sourceUrls={eventResults.sourceUrls}/>
          </>
        )}
      </AppShell.Main>
    </>
  )
}