import { ActionIcon, Button, Table, Text } from '@mantine/core'
import { IconPencil, IconPlus } from '@tabler/icons-react'
import * as React from 'react'
import { useMemo } from 'react'
import { useNavigate } from 'react-router'
import type { BaseSerieEvent, RaceEvent, Serie } from '../../../../../shared/types'
import { EmptyState } from '../../../../Shared/EmptyState'
import { PublishedBadge } from '../../../Shared/PublishedBadge/PublishedBadge'

type SerieEventListProps = {
  serie: Serie
  serieEvents?: BaseSerieEvent[]
  type: 'individual' | 'team'
  raceEvents: RaceEvent[]
  onAdd: () => void
}

export const SerieEventList: React.FC<SerieEventListProps> = ({ serie, serieEvents, type, raceEvents, onAdd }) => {
  const navigate = useNavigate()
  // @ts-ignore
  const sortedSerieEvents = useMemo(() => (serieEvents ?? []).sort((a, b) => a.date < b.date ? 1 : -1), [serieEvents])

  if (!sortedSerieEvents.length) return (
    <EmptyState
      text="No events for this serie"
      button={
        <Button size="sm" leftSection={<IconPlus size={14}/>} onClick={onAdd}>
          Add Race Standings
        </Button>
      }
    />
  )

  return (

    <Table withTableBorder>
      <Table.Thead>
        <Table.Tr>
          <Table.Th style={{ width: 120 }}>Date</Table.Th>
          <Table.Th>Event</Table.Th>
          <Table.Th style={{ width: 130, textAlign: 'center' }}>Status</Table.Th>
          <Table.Th style={{ width: 50 }}></Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {sortedSerieEvents.map(serieEvent => {
          const raceEvent = raceEvents.find(e => e.serie === serie.alias && e.date === serieEvent.date)

          return (
            <Table.Tr key={`serie-${serie.hash}-${serieEvent.date}`}>
              <Table.Td>
                <Text size="sm">{serieEvent.date}</Text>
              </Table.Td>
              <Table.Td>
                <Text size="sm">{raceEvent?.name}</Text>
              </Table.Td>
              <Table.Td style={{ textAlign: 'center' }}>
                <PublishedBadge published={serieEvent.published}/>
              </Table.Td>
              <Table.Td style={{ textAlign: 'right' }}>
                <ActionIcon variant="subtle" aria-label="Edit"
                            onClick={() => navigate(`/admin/series/${serie.year}/${serie.hash}/standings/${type}/${serieEvent.date}`)}>
                  <IconPencil/>
                </ActionIcon>
              </Table.Td>
            </Table.Tr>
          )
        })}
      </Table.Tbody>
    </Table>
  )
}