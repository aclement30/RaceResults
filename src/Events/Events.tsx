import { Badge, Card, Group, Text } from '@mantine/core'
import type { RaceEvent } from '../utils/loadStartupData'
import { sortBy } from 'lodash'
import { useNavigate } from 'react-router'
import { useContext } from 'react'
import { AppContext } from '../AppContext'

const today = new Date().toISOString().slice(0, 10)

const EventCard = ({ event }: { event: RaceEvent }) => {
  let navigate = useNavigate()

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder
          style={{ cursor: 'pointer' }} onClick={() => navigate(`/event/${event.key}`)}>
      <Card.Section>
        <Group justify="space-between" mt="md" mb="xs">
          <Text fw={500} size="lg" mt="md">{event.name}</Text>
          <Badge color="pink"> {event.organizer}</Badge>
        </Group>

        {event.date}
      </Card.Section>
    </Card>
  )
}

export const Events: React.FC = () => {
  const { events } = useContext(AppContext)

  const todayEvents = events.filter(({ date }) => date === today)
  const pastEvents = sortBy(events.filter(({ date }) => date !== today && date! < today), 'date').reverse()

  return (
    <>
      {!!todayEvents.length && (
        <>
          <h2>Today</h2>
          {todayEvents.map((event) => (
            <EventCard key={`${event.key}`} event={event}/> ))}
        </>
      )}

      {!!pastEvents.length && (
        <>
          <h2>Past Events</h2>
          {pastEvents.map((event) => (
            <EventCard key={`${event.key}`} event={event}/> ))}
        </>
      )}
    </>
  )
}