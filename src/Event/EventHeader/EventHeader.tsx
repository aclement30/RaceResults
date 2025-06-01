import { Button, Group } from '@mantine/core'
import type { EventSummary } from '../../types/results'
import { useNavigate } from 'react-router'
import { OrganizerBadge } from '../Shared/OrganizerBadge'
import { useContext } from 'react'
import { AppContext } from '../../AppContext'

export const EventHeader = ({ event }: { event: EventSummary }) => {
  const navigate = useNavigate()
  const { series } = useContext(AppContext)

  const yearSeries = series.get(event.year) || []

  const getSerieLabel = (eventSerieAlias: string | null | undefined): string | null => {
    if (!eventSerieAlias) return null

    const serieSummary = yearSeries.find(s => s.alias === eventSerieAlias)
    if (serieSummary) {
      return serieSummary.name
    } else {
      switch (eventSerieAlias) {
        case 'BCProvincials':
          return 'BC Provincials'
        case 'SpringSeries':
          return 'Spring Series'
        default:
          return eventSerieAlias
      }
    }
  }

  return (
    <>
      <Group justify="space-between" style={{ alignItems: 'center', marginTop: 5, flexWrap: 'nowrap' }}>
        <div style={{
          backgroundColor: '#dee2e6',
          padding: '2px 6px',
          display: 'inline-block',
          alignSelf: 'flex-start',
          fontWeight: 700,
        }}>
          {event.date}
        </div>

        <div className="mantine-hidden-from-sm">
          <OrganizerBadge organizerAlias={event.organizerAlias}/>
        </div>
      </Group>

      <Group justify="space-between" style={{ alignItems: 'center', marginTop: 5, flexWrap: 'nowrap' }}>
        <h3 style={{ marginTop: 0, marginBottom: 0 }}>{event.name}</h3>

        <div className="mantine-visible-from-sm">
          <OrganizerBadge organizerAlias={event.organizerAlias}/>
        </div>
      </Group>

      {/*<Group justify="space-between" style={{ alignItems: 'center', marginTop: 5 }}>*/}
      {/*  <div></div>*/}

      {/*  <div style={{ textAlign: 'right' }}>*/}
      {/*    {organizerLabel !== event.organizerName && ( <Text size="sm">{event.organizerName}</Text> )}*/}
      {/*    /!*<Text size="sm"><a href="mailto:drew@oh-water.com">{event.organizerEmail}</a></Text>*!/*/}
      {/*  </div>*/}
      {/*</Group>*/}

      {event.series && (
        <Button
          variant="transparent" size="compact-sm" c="dimmed"
          style={{
            paddingLeft: 0, display: 'inline-block',
            alignSelf: 'flex-start',
          }}
          onClick={() => navigate(`/events?year=${event.year}&series=${event.series}`)}
        >
          {getSerieLabel(event.series)}
        </Button>
      )}
    </>
  )
}