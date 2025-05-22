import type { BaseEvent } from '../../utils/loadStartupData'
import { Badge, Group, Text } from '@mantine/core'
import { ORGANIZERS } from '../../config/organizers'

function getOrganizerLabel(organizer: string): string {
  return ORGANIZERS[organizer]?.label || organizer
}

function getOrganizerColor(organizer: string): string {
  return ORGANIZERS[organizer]?.color || 'black'
}

function getOrganizerTextColor(organizer: string): string {
  return ORGANIZERS[organizer]?.textColor || 'white'
}

export const EventHeader = ({ event }: { event: BaseEvent }) => {
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
        <Badge
          color={getOrganizerColor(event.organizer)}
          size="lg"
          style={{ color: getOrganizerTextColor(event.organizer) }}
        >{getOrganizerLabel(event.organizer)}</Badge>
      </Group>

      <Text size="sm" c="dimmed">
        {event.series}
      </Text>
    </>
  )
}