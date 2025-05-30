import { Button, Group } from '@mantine/core'
import type { EventSummary } from '../../types/results'
import { useNavigate } from 'react-router'
import { OrganizerBadge } from '../Shared/OrganizerBadge'

export const EventHeader = ({ event }: { event: EventSummary }) => {
  const navigate = useNavigate()

  return (
    <>
      <div style={{
        backgroundColor: '#dee2e6',
        padding: '2px 6px',
        display: 'inline-block',
        alignSelf: 'flex-start',
        fontWeight: 700,
      }}>
        {event.date}
      </div>

      <Group justify="space-between" style={{ alignItems: 'center', marginTop: 5 }}>
        <h2 style={{ marginTop: 0, marginBottom: 0 }}>{event.name}</h2>
        <OrganizerBadge organizerAlias={event.organizerAlias}/>
      </Group>

      {/*<Group justify="space-between" style={{ alignItems: 'center', marginTop: 5 }}>*/}
      {/*  <div></div>*/}

      {/*  <div style={{ textAlign: 'right' }}>*/}
      {/*    {organizerLabel !== event.organizerName && ( <Text size="sm">{event.organizerName}</Text> )}*/}
      {/*    /!*<Text size="sm"><a href="mailto:drew@oh-water.com">{event.organizerEmail}</a></Text>*!/*/}
      {/*  </div>*/}
      {/*</Group>*/}

      <Button variant="transparent" size="compact-sm" c="dimmed" style={{
        paddingLeft: 0, display: 'inline-block',
        alignSelf: 'flex-start',
      }}
              onClick={() => navigate(`/events?year=${event.year}&series=${event.series}`)}>{event.series}</Button>
    </>
  )
}