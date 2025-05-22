import { AppShell, Button, Card, Divider, Group } from '@mantine/core'
import { type BaseEvent } from '../utils/loadStartupData'
import { sortBy } from 'lodash'
import { useNavigate, useSearchParams } from 'react-router'
import { useContext, useEffect } from 'react'
import { AppContext } from '../AppContext'
import { EventHeader } from '../Event/EventHeader/EventHeader'
import { fetchEventsAndSeriesForYear } from '../utils/aws-s3'

const today = new Date().toISOString().slice(0, 10)
const currentYear = new Date().getFullYear()

const EventCard = ({ event }: { event: BaseEvent }) => {
  let navigate = useNavigate()

  return (
    <Card
      shadow="sm"
      padding="lg"
      radius="md"
      withBorder
      style={{ cursor: 'pointer', marginBottom: '1rem' }}
      onClick={() => navigate(`/events/${event.year}/${event.hash}`)}
    >
      <EventHeader event={event}/>
    </Card>
  )
}

const YearButtons = ({ selectedYear }: { selectedYear: number }) => {
  const navigate = useNavigate()

  const years = []

  for (let y = currentYear; y > currentYear - 10; y--) {
    years.push(y)
  }

  return (
    <Group style={{ marginTop: 20 }}>
      {years.map((year) => (
        <Button key={year} variant={year === selectedYear ? 'filled' : 'default'}
                onClick={() => navigate(`/events?year=${year}`)}>{year}</Button> ))}
    </Group>
  )
}

export const Events: React.FC = () => {
  const [searchParams] = useSearchParams()
  const year = +( searchParams.get('year') || new Date().getFullYear() )
  const { events, setLoading, setEventsForYear, setSourceFilesForYear } = useContext(AppContext)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        const { events, sourceFiles } = await fetchEventsAndSeriesForYear(year)

        setEventsForYear(events, year)
        // setSeriesForYear(series, year)
        setSourceFilesForYear(sourceFiles, year)
        setLoading(false)
      } catch (error) {
        console.error(error)
      }
    }

    if (!events.get(year)) {
      fetchData()
    }
  }, [year, setLoading, setEventsForYear])

  const todayEvents = events.get(year)?.filter(({ date }) => date === today) || []
  const pastEvents = sortBy(events.get(year)?.filter(({ date }) => date !== today && date! < today), 'date').reverse() || []

  return (
    <AppShell.Main>
      {!!todayEvents.length && (
        <>
          <h2>Today</h2>
          {todayEvents.map((event) => (
            <EventCard key={`${event.hash}`} event={event}/> ))}
        </>
      )}

      {!!pastEvents.length && (
        <>
          <h2>Past Events</h2>
          {pastEvents.map((event) => (
            <EventCard key={`${event.hash}`} event={event}/> ))}
        </>
      )}

      <Divider/>

      <YearButtons selectedYear={+year}/>
    </AppShell.Main>
  )
}