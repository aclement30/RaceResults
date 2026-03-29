import { ActionIcon, Badge, Button, Divider, Group, LoadingOverlay, Table } from '@mantine/core'
import { IconLock, IconPencil, IconPlus } from '@tabler/icons-react'
import * as React from 'react'
import { useContext, useMemo } from 'react'
import { useNavigate } from 'react-router'
import type { Serie } from '../../../../shared/types'
import { Loader } from '../../../Loader/Loader'
import { EmptyState } from '../../../Shared/EmptyState'
import { AdminContext } from '../../Shared/AdminContext'
import { PublishedBadge } from '../../Shared/PublishedBadge/PublishedBadge'
import { RequireAdmin } from '../../Shared/RequireAdmin/RequireAdmin'
import { useProfile } from '../../utils/useProfile'

type AdminSerieListProps = {
  series: Serie[]
  year: number
  loading: boolean
}

export const AdminSerieList: React.FC<AdminSerieListProps> = ({
  series,
  year,
  loading,
}) => {
  const navigate = useNavigate()
  const { organizerAlias, isAdmin } = useProfile()
  const { organizers } = useContext(AdminContext)

  const sortedSeries = useMemo(() => {
    return series.sort((a, b) => a.name.localeCompare(b.name))
  }, [series])

  const rows = useMemo(() => sortedSeries.map((serie) => {
    return (
      <Table.Tr key={`event-${serie.hash}`}>
        <Table.Td>
          {serie.name}
        </Table.Td>
        <Table.Td>
          {organizers.get(serie.organizerAlias)?.displayName || serie.organizerAlias}
        </Table.Td>
        <Table.Td>
          <Group gap="xs">
            {serie.types.includes('individual') && (
              <Badge size="sm" variant="filled">Individual</Badge>
            )}
            {serie.types.includes('team') && (
              <Badge size="sm" variant="filled">Team</Badge>
            )}
          </Group>
        </Table.Td>
        <RequireAdmin>
          <Table.Td>
            {serie.source ? (
              <Badge
                size="sm"
                variant="dot"
                color={serie.source === 'manual' ? 'blue' : 'gray'}
              >
                {serie.source}{serie.source === 'ingest' ? `:${serie.provider}` : ''}
              </Badge>
            ) : '-'}
          </Table.Td>
          <Table.Td style={{ textAlign: 'center' }}>
            {serie.userLocked && <IconLock style={{ marginTop: '0.5em', color: 'var(--mantine-color-dimmed)' }}/>}
          </Table.Td>
        </RequireAdmin>
        <Table.Td style={{ textAlign: 'center' }}>
          <PublishedBadge published={serie.published}/>
        </Table.Td>
        <Table.Td style={{ textAlign: 'right' }}>
          <ActionIcon variant="subtle" aria-label="Edit"
                      disabled
                      onClick={() => navigate(`/admin/series/${serie.year}/${serie.hash}/edit`)}>
            <IconPencil/>
          </ActionIcon>
        </Table.Td>
      </Table.Tr>
    )
  }), [sortedSeries, organizers])

  return (
    <>
      <Group justify="space-between" style={{ alignItems: 'flex-start' }}>
        <div>
          <Group gap={5} style={{ alignItems: 'center' }}>
            <h2 style={{
              marginTop: 0,
              marginBottom: 0
            }}>{year} Series{(!isAdmin && organizerAlias) ? ` - ${organizers.get(organizerAlias)?.displayName}` : ''}</h2>
          </Group>
        </div>

        <Button leftSection={<IconPlus/>} onClick={() => navigate('/admin/series/new')} disabled>Create Serie</Button>
      </Group>

      <Divider my="md"/>

      <LoadingOverlay
        visible={loading} overlayProps={{ radius: 'sm', blur: 2 }}
        loaderProps={{
          children: <Loader text="Loading data..."/>,
        }}
      />

      <div style={{ width: '100%' }}>
        {!!rows.length ? (
          <>
            <Table style={{ tableLayout: 'fixed' }} withTableBorder>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Name</Table.Th>
                  <Table.Th style={{ width: 250 }}>Organizer</Table.Th>
                  <Table.Th style={{ width: 250 }}>Standings</Table.Th>
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
          </>
        ) : (
          <EmptyState>No series matching the selected filters</EmptyState>
        )}
      </div>
    </>
  )
}