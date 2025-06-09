import { AppShell, LoadingOverlay, Stack, Text } from '@mantine/core'
import sortBy from 'lodash/sortBy'
import { useSearchParams } from 'react-router'
import { useContext, useMemo } from 'react'
import { AppContext } from '../AppContext'
import { Navbar } from './Navbar/Navbar'
import { EventCard } from './EventCard/EventCard'
import { SerieCard } from './SerieCard/SerieCard'
import { useEventsAndSeries } from '../utils/useEventsAndSeries'
import { Loader } from '../Loader/Loader'

const today = new Date().toLocaleDateString('sv', { timeZone: 'America/Vancouver' }).slice(0, 10)

export const Events: React.FC = () => {
  const [searchParams] = useSearchParams()
  const filters = {
    year: +( searchParams.get('year') || new Date().getFullYear() ),
    serie: searchParams.get('series') || null,
  }

  const { events, series, loading } = useContext(AppContext)

  useEventsAndSeries(filters.year)

  const filteredEvents = useMemo(() => {
    const yearEvents = events.get(filters.year) || []

    let filteredEvents = yearEvents

    if (filters.serie) {
      filteredEvents = filteredEvents.filter((event) => event.serie === filters.serie)
    }

    return filteredEvents
  }, [filters.year, filters.serie, events])

  const todayEvents = filteredEvents.filter(({ date }) => date === today)
  const pastEvents = sortBy(filteredEvents.filter(({ date }) => date !== today && date! < today), 'date').reverse()
  const emptyEvents = !events.get(filters.year)?.length

  const matchingSerie = filters.serie && series.get(filters.year)?.find((serieSummary) => serieSummary.alias === filters.serie)

  return (
    <>
      <Navbar filters={filters}/>

      <AppShell.Main>
        <LoadingOverlay
          visible={loading && !events.get(filters.year)} overlayProps={{ radius: 'sm', blur: 2 }}
          loaderProps={{
            children: <Loader text="Loading events..."/>,
          }}
        />

        {matchingSerie && <SerieCard serie={matchingSerie}/>}

        {!!todayEvents.length && (
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ marginTop: 0 }}>Today</h2>
            {todayEvents.map((event) => (
              <EventCard key={`${event.hash}`} event={event}/> ))}
          </div>
        )}

        {!!pastEvents.length && (
          <>
            <h2 style={{ marginTop: 0 }}>Past Events</h2>
            {pastEvents.map((event) => (
              <EventCard key={`${event.hash}`} event={event}/> ))}
          </>
        )}

        {!loading && emptyEvents && (
          <Stack align="center" gap="xs" style={{ marginTop: '1rem', marginBottom: '2rem' }}>
            <Text c="dimmed" size="sm">
              No event found...
            </Text>
          </Stack>
        )}
      </AppShell.Main>
    </>
  )
}