import { ActionIcon, Badge, Button, Divider, Group, LoadingOverlay, Pagination, Table } from '@mantine/core'
import { IconLock, IconPencil, IconPlus } from '@tabler/icons-react'
import keyBy from 'lodash/keyBy'
import * as React from 'react'
import { useContext, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import type { RaceEvent, Serie } from '../../../../shared/types'
import { getSerieLabel } from '../../../Event/utils'
import { Loader } from '../../../Loader/Loader'
import { EmptyState } from '../../../Shared/EmptyState'
import { SearchField } from '../../../Shared/SearchField'
import { AdminContext } from '../../Shared/AdminContext'
import { PublishedBadge } from '../../Shared/PublishedBadge/PublishedBadge'
import { RequireAdmin } from '../../Shared/RequireAdmin/RequireAdmin'
import { useProfile } from '../../utils/useProfile'

type AdminEventListProps = {
  events: RaceEvent[]
  series: Serie[]
  loading: boolean
  title?: string
  showSearch?: boolean
}

const ROWS_PER_PAGE = 50

export const AdminEventList: React.FC<AdminEventListProps> = ({
  events,
  series,
  loading,
  title,
  showSearch = true
}) => {
  const [searchValue, setSearchValue] = useState('')
  const navigate = useNavigate()
  const [activePage, setPage] = useState<number>(1)
  const { organizerAlias, isAdmin } = useProfile()
  const { organizers } = useContext(AdminContext)

  const seriesByAlias = useMemo(() => keyBy(series, 'alias'), [series])

  const filteredEvents = useMemo(() => {
    const sortedEvents: RaceEvent[] = events.sort((a, b) => a.date.localeCompare(b.date)).reverse()

    if (!searchValue) return sortedEvents

    const searchValueLower = searchValue.toLowerCase().trim()

    return sortedEvents.filter((event) => {
      return event.name.toLowerCase().includes(searchValueLower)
    })
  }, [events, searchValue])

  const rows = useMemo(() => filteredEvents.slice((activePage - 1) * ROWS_PER_PAGE, activePage * ROWS_PER_PAGE).map((event) => {
    return (
      <Table.Tr key={`event-${event.hash}`}>
        <Table.Td>{event.date}</Table.Td>
        <Table.Td>
          {event.name}
        </Table.Td>
        <Table.Td>
          {organizers.get(event.organizerAlias)?.displayName || event.organizerAlias}
        </Table.Td>
        <Table.Td>
          {event.serie ? (seriesByAlias[event.serie]?.name || getSerieLabel(event.serie)) : ''}
        </Table.Td>
        <Table.Td>
          <Badge size="sm" variant="outline">
            {event.discipline}
          </Badge>
        </Table.Td>
        <Table.Td>
          <Group gap="xs">
            {event.raceType && (
              <Badge size="sm" variant="filled">
                {event.raceType}
              </Badge>
            )}

            {event.sanctionedEventType && (
              <Badge size="sm" variant="light">
                {event.sanctionedEventType}
              </Badge>
            )}
          </Group>
        </Table.Td>
        <RequireAdmin>
          <Table.Td>
            {event.source ? (
              <Badge
                size="sm"
                variant="dot"
                color={event.source === 'manual' ? 'blue' : 'gray'}
              >
                {event.source}{event.source === 'ingest' ? `:${event.provider}` : ''}
              </Badge>
            ) : '-'}
          </Table.Td>
          <Table.Td style={{ textAlign: 'center' }}>
            {event.userLocked && <IconLock style={{ marginTop: '0.5em', color: 'var(--mantine-color-dimmed)' }}/>}
          </Table.Td>
        </RequireAdmin>
        <Table.Td style={{ textAlign: 'center' }}>
          <PublishedBadge published={event.published}/>
        </Table.Td>
        <Table.Td style={{ textAlign: 'right' }}>
          <ActionIcon variant="subtle" aria-label="Edit"
                      onClick={() => navigate(`/admin/events/${event.date.slice(0, 4)}/${event.hash}/edit`)}>
            <IconPencil/>
          </ActionIcon>
        </Table.Td>
      </Table.Tr>
    )
  }), [filteredEvents, organizers, activePage])

  return (
    <>
      <Group justify="space-between" style={{ alignItems: 'flex-start' }}>
        <div>
          <Group gap={5} style={{ alignItems: 'center' }}>
            <h2 style={{
              marginTop: 0,
              marginBottom: 0
            }}>{title || 'Events'}{(!isAdmin && organizerAlias) ? ` - ${organizers.get(organizerAlias)?.displayName}` : ''}</h2>
          </Group>
        </div>

        <Button leftSection={<IconPlus/>} onClick={() => navigate('/admin/events/new')}>Add Event</Button>
      </Group>

      <Divider my="md"/>

      <LoadingOverlay
        visible={loading} overlayProps={{ radius: 'sm', blur: 2 }}
        loaderProps={{
          children: <Loader text="Loading data..."/>,
        }}
      />

      {showSearch && (
        <Group style={{ paddingBottom: '1rem', marginTop: '1rem' }}>
          <SearchField value={searchValue} onChange={setSearchValue} placeholder="Search event name..."/>
        </Group>
      )}

      <div style={{ width: '100%' }}>
        {!!rows.length ? (
          <>
            <Table style={{ tableLayout: 'fixed' }} withTableBorder>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th style={{ width: 120 }}>Date</Table.Th>
                  <Table.Th>Name</Table.Th>
                  <Table.Th style={{ width: 180 }}>Organizer</Table.Th>
                  <Table.Th style={{ width: 250 }}>Series</Table.Th>
                  <Table.Th style={{ width: 100 }}>Discipline</Table.Th>
                  <Table.Th style={{ width: 200 }}>Race Type</Table.Th>
                  <RequireAdmin>
                    <Table.Th style={{ width: 170 }}>Source</Table.Th>
                    <Table.Th style={{ width: 80, textAlign: 'center' }}>Protected</Table.Th>
                  </RequireAdmin>
                  <Table.Th style={{ width: 130, textAlign: 'center' }}>Status</Table.Th>
                  <Table.Th style={{ width: 50 }}></Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>{rows}</Table.Tbody>
            </Table>

            {filteredEvents.length > ROWS_PER_PAGE && (
              <Pagination
                value={activePage}
                onChange={setPage}
                total={Math.ceil(filteredEvents.length / ROWS_PER_PAGE)}
                style={{ marginTop: '1rem' }}
              />
            )}
          </>
        ) : (
          <EmptyState text="No events matching the selected filters"/>
        )}
      </div>
    </>
  )
}