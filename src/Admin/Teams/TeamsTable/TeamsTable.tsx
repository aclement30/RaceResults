import { ActionIcon, Anchor, Group, Table, Pagination, Text } from '@mantine/core'
import { useMemo, useState } from 'react'
import * as React from 'react'
import { modals } from '@mantine/modals'
import { IconPencil, IconExternalLink, IconSquareX, IconRestore } from '@tabler/icons-react'
import { useNavigate } from 'react-router'
import { EmptyState } from '../../../Shared/EmptyState'
import { SearchField } from '../../../Shared/SearchField'
import type { Team, TeamRoster } from '../../../types/team'
import { adminApi } from '../../utils/api'
import { showErrorMessage } from '../../../utils/showErrorMessage'

type TeamsTableProps = {
  teams: Team[]
  teamRosters: TeamRoster[]
  onChange: () => void
}

const ROWS_PER_PAGE = 50

export const TeamsTable: React.FC<TeamsTableProps> = ({ teams, teamRosters, onChange }) => {
  const [searchValue, setSearchValue] = useState('')
  const navigate = useNavigate()
  const [activePage, setPage] = useState<number>(1)

  const sortedTeams = useMemo(() => {
    const allTeams: Team[] = []

    teams.forEach(team => allTeams.push(team))

    return allTeams.sort((a, b) => a.name.localeCompare(b.name))
  }, [teams])

  const filteredTeams = useMemo(() => {
    if (!searchValue) return sortedTeams

    const searchValueLower = searchValue.toLowerCase().trim()

    return sortedTeams.filter((team) => {
      const { name } = team
      const teamLower = name.toLowerCase()

      return name.includes(searchValueLower) || teamLower?.includes(searchValueLower)
    })
  }, [sortedTeams, searchValue])

  const handleDeleteTeam = async (teamId: number) => {
    const teamName = teams.find(t => t.id === teamId)!.name

    modals.openConfirmModal({
      title: 'Delete Team?',
      children: (
        <Text size="sm">
          Are you sure you want to delete <strong>{teamName}</strong>?
        </Text>
      ),
      labels: { confirm: 'Confirm', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        try {
          await adminApi.delete.team(teamId)

          onChange()
        } catch (error) {
          showErrorMessage({ title: 'Error', message: (error as any).message })
        }
      },
    })
  }

  const handleRestoreTeam = async (teamId: number) => {
    try {
      await adminApi.restore.team(teamId)

      onChange()
    } catch (error) {
      showErrorMessage({ title: 'Error', message: (error as any).message })
    }
  }

  const getRowStyles = (team: Team) => {
    if (team.deleted) return { opacity: 0.3, textDecoration: 'line-through' }

    return {}
  }

  const rows = useMemo(() => filteredTeams.slice((activePage - 1) * ROWS_PER_PAGE, activePage * ROWS_PER_PAGE).map((team) => {
    const roster = teamRosters.find(r => r.teamId === team.id)
    const rowStyles = getRowStyles(team)

    return (
      <Table.Tr key={`team-${team.id}`}>
        <Table.Td style={rowStyles}>{team.id}</Table.Td>
        <Table.Td style={rowStyles}>
          <Anchor onClick={() => window.open(`/teams/${team.id}`)} target="_blank">
            {team.name}
            <span style={{ paddingLeft: 5, top: 2, position: 'relative' }}><IconExternalLink size="1rem"/></span>
          </Anchor>
        </Table.Td>
        <Table.Td style={rowStyles}>{team.city}</Table.Td>
        <Table.Td style={rowStyles}>{team.website && (
          <Anchor href={team.website} target="_blank">{team.website}&nbsp;<span
            style={{ top: 2, position: 'relative' }}><IconExternalLink size="1rem"/></span>
          </Anchor>)}</Table.Td>
        <Table.Td style={{ textAlign: 'center', ...rowStyles }}>{!!roster && roster?.athletes.length}</Table.Td>
        <Table.Td style={{ textAlign: 'right' }}>
          <Group gap="xs" justify="flex-end">
            <ActionIcon
              variant="subtle"
              aria-label="Edit"
              disabled={team.deleted}
              onClick={() => navigate(`/admin/teams/${team.id}/edit`)}>
              <IconPencil/>
            </ActionIcon>

            {team.deleted ? (
              <ActionIcon
                variant="subtle"
                aria-label="Restore"
                onClick={() => handleRestoreTeam(team.id)}>
                <IconRestore/>
              </ActionIcon>
            ) : (
              <ActionIcon
                variant="subtle"
                color="red"
                aria-label="Delete"
                onClick={() => handleDeleteTeam(team.id)}>
                <IconSquareX/>
              </ActionIcon>
            )}
          </Group>
        </Table.Td>
      </Table.Tr>
    )
  }), [filteredTeams, activePage])

  return (
    <>
      <Group style={{ paddingBottom: '1rem', marginTop: '1rem' }}>
        <SearchField value={searchValue} onChange={setSearchValue} placeholder="Search team name..."/>
      </Group>

      <div style={{ width: '100%' }}>
        {!!rows.length ? (
          <>
            <Table style={{ tableLayout: 'fixed' }} withTableBorder>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th style={{ width: 50 }}>ID</Table.Th>
                  <Table.Th>Name</Table.Th>
                  <Table.Th style={{ width: 200 }}>City</Table.Th>
                  <Table.Th>Website</Table.Th>
                  <Table.Th style={{ width: 100, textAlign: 'center' }}>Athletes</Table.Th>
                  <Table.Th style={{ width: 90 }}></Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>{rows}</Table.Tbody>
            </Table>

            <Pagination
              value={activePage}
              onChange={setPage}
              total={Math.ceil(filteredTeams.length / ROWS_PER_PAGE)}
              style={{ marginTop: '1rem' }}
            />
          </>
        ) : (
          <EmptyState>No teams matching the selected filters</EmptyState>
        )}
      </div>
    </>
  )
}