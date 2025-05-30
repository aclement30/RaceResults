import { AppShell, Divider, LoadingOverlay, Stack, Text } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { sortBy } from 'lodash'
import { useSearchParams } from 'react-router'
import { useContext, useEffect, useMemo } from 'react'
import { AppContext } from '../AppContext'
import { fetchEventsAndSeries, validateYear } from '../utils/aws-s3'
import { Navbar } from './Navbar/Navbar'
import { EventCard } from './EventCard/EventCard'
import { SerieCard } from './SerieCard/SerieCard'

const today = new Date().toLocaleString('sv').slice(0, 10)

export const Events: React.FC = () => {
  const [searchParams] = useSearchParams()
  const filters = {
    year: +( searchParams.get('year') || new Date().getFullYear() ),
    serie: searchParams.get('series') || null,
  }

  const { events, series, loading, setLoading, setEvents, setSeries } = useContext(AppContext)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        if (!validateYear(filters.year)) throw new Error('Invalid year:' + filters.year)

        const { events, series } = await fetchEventsAndSeries(filters.year)

        setEvents(events, filters.year)
        setSeries(series, filters.year)
        // setSeriesForYear(series, year)
      } catch (error) {
        notifications.show({
          title: 'Error',
          // @ts-ignore
          message: `An error occurred while fetching events: ${error.message}`,
        })
      } finally {
        setLoading(false)
      }
    }

    if (!events.get(filters.year)) {
      fetchData()
    }
  }, [filters.year])

  const filteredEvents = useMemo(() => {
    const yearEvents = events.get(filters.year) || []

    let filteredEvents = yearEvents

    if (filters.serie) {
      filteredEvents = filteredEvents.filter((event) => event.series === filters.serie)
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
        <LoadingOverlay visible={loading} loaderProps={{ children: 'Loading events...' }}/>

        {matchingSerie && <SerieCard serie={matchingSerie}/>}

        {!!todayEvents.length && (
          <div style={{ marginBottom: 20 }}>
            <h2>Today</h2>
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

        {emptyEvents && (
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