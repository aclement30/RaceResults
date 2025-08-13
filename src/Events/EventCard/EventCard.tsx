import type { EventSummary } from '../../types/results'
import { useNavigate } from 'react-router'
import { Card } from '@mantine/core'
import { EventHeader } from '../../Event/EventHeader/EventHeader'

type EventCardProps = {
  event: EventSummary
}

export const EventCard: React.FC<EventCardProps> = ({ event }) => {
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