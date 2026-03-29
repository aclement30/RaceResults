import { ActionIcon, Button, Group, Select, Stack, Table, Text } from '@mantine/core'
import { IconPlus, IconSquareX, IconRestore } from '@tabler/icons-react'
import React, { useEffect, useMemo, useState } from 'react'
import { adminApi } from '../../../utils/api'
import { showSuccessMessage } from '../../../../utils/showSuccessMessage'
import { showErrorMessage } from '../../../../utils/showErrorMessage'
import type { Athlete, Team, TeamRoster } from '../../../../../shared/types'
import { useNavigate } from 'react-router'

type AthleteRowStatus = 'existing' | 'added' | 'removed'

type AthleteRow = {
  athleteUciId: string
  athlete: Athlete
  status: AthleteRowStatus
}

type TeamRosterProps = {
  athletes: Athlete[]
  team: Team
  allTeams: Team[]
  teamRoster: TeamRoster | null
  onChange: () => void
}

const CURRENT_YEAR = new Date().getFullYear()

export const TeamRosterForm: React.FC<TeamRosterProps> = ({ athletes, team, allTeams, teamRoster, onChange }) => {
  const [saving, setSaving] = useState(false)
  const [originalMembers, setOriginalMembers] = useState<string[]>(teamRoster?.athletes.map(a => a.athleteUciId) || [])
  const [currentMembers, setCurrentMembers] = useState<string[]>(teamRoster?.athletes.map(a => a.athleteUciId) || [])
  const [searchValue, setSearchValue] = useState<string | null>(null)
  const navigate = useNavigate()

  // Update members when teamRoster changes
  useEffect(() => {
    const memberIds = teamRoster?.athletes.map(a => a.athleteUciId) || []
    // Sort initial members alphabetically by name for consistent ordering
    const sortedMemberIds = memberIds.slice().sort((aId, bId) => {
      const aAthlete = athletes.find(a => a.uciId === aId)
      const bAthlete = athletes.find(a => a.uciId === bId)
      if (!aAthlete || !bAthlete) return 0

      const aName = `${aAthlete.firstName} ${aAthlete.lastName}`
      const bName = `${bAthlete.firstName} ${bAthlete.lastName}`
      return aName.localeCompare(bName)
    })

    setOriginalMembers(sortedMemberIds)
    setCurrentMembers(sortedMemberIds)
  }, [teamRoster, athletes])

  // Calculate athlete rows with status
  const athleteRows = useMemo((): AthleteRow[] => {
    const rows: AthleteRow[] = []

    // First, show existing and removed members in their original order
    originalMembers.forEach(uciId => {
      const athlete = athletes.find(a => a.uciId === uciId)
      if (athlete) {
        const isRemoved = !currentMembers.includes(uciId)
        rows.push({
          athleteUciId: uciId,
          athlete,
          status: isRemoved ? 'removed' : 'existing'
        })
      }
    })

    // Then, add newly added members at the end (in order they were added)
    currentMembers.forEach(uciId => {
      if (!originalMembers.includes(uciId)) {
        const athlete = athletes.find(a => a.uciId === uciId)
        if (athlete) {
          rows.push({
            athleteUciId: uciId,
            athlete,
            status: 'added'
          })
        }
      }
    })

    return rows
  }, [currentMembers, originalMembers, athletes])

  // Calculate change counts
  const addedCount = athleteRows.filter(row => row.status === 'added').length
  const removedCount = athleteRows.filter(row => row.status === 'removed').length

  const handleRosterSubmit = async () => {
    try {
      setSaving(true)

      await adminApi.update.teamRoster(team.id, currentMembers)

      showSuccessMessage({
        title: 'Success',
        message: `Team roster for ${team.name} has been successfully updated!`
      })

      onChange()
    } catch (error) {
      showErrorMessage({ title: 'Error', message: (error as any).message })
    } finally {
      setSaving(false)
    }
  }

  const availableAthletes = useMemo(() =>
      athletes
      .filter(athlete => !currentMembers.includes(athlete.uciId))
      .map(athlete => {
        const athleteTeamId = athlete.teams?.[CURRENT_YEAR]?.id
        const athleteTeam = athleteTeamId ? allTeams.find(t => t.id === athleteTeamId) : null

        return {
          value: athlete.uciId,
          label: `${athlete.firstName} ${athlete.lastName} (${athlete.uciId})` + (athleteTeam ? ` - ${athleteTeam?.name}` : '')
        }
      })
      .sort((a, b) => a.label.localeCompare(b.label)),
    [athletes, currentMembers]
  )

  const handleAddAthlete = (uciId: string) => {
    if (!currentMembers.includes(uciId)) {
      setCurrentMembers(prev => [...prev, uciId])
      setSearchValue(null)
    }
  }

  const handleRemoveAthlete = (uciId: string) => {
    setCurrentMembers(prev => prev.filter(id => id !== uciId))
  }

  const handleRestoreAthlete = (uciId: string) => {
    if (!currentMembers.includes(uciId)) {
      setCurrentMembers(prev => [...prev, uciId])
    }
  }

  // Get row styling based on status
  const getRowStyles = (status: AthleteRowStatus) => {
    switch (status) {
      case 'added':
        return {
          style: {
            borderLeft: '4px solid var(--mantine-color-green-6)',
            backgroundColor: 'var(--mantine-color-green-0)'
          }
        }
      case 'removed':
        return {
          style: { borderLeft: '4px solid var(--mantine-color-red-6)', backgroundColor: 'var(--mantine-color-red-0)' }
        }
      default:
        return {}
    }
  }

  return (
    <Stack gap="md">
      <Table withTableBorder>
        <Table.Thead>
          <Table.Tr>
            <Table.Th style={{ width: '50%' }}>Name</Table.Th>
            <Table.Th style={{ width: '50%' }}>UCI ID</Table.Th>
            <Table.Th w={60}></Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {athleteRows.map(({ athleteUciId, athlete, status }) => {
            const athleteTeamId = athlete.teams?.[CURRENT_YEAR]?.id
            const differentAthleteTeam = athleteTeamId && athleteTeamId !== team.id ? allTeams.find(t => t.id === athleteTeamId) : null

            return (
              <Table.Tr key={athleteUciId} {...getRowStyles(status)}>
                <Table.Td style={{ opacity: status === 'removed' ? 0.6 : 1 }}>
                  <Group>
                    <span style={{ textDecoration: status === 'removed' ? 'line-through' : 'none' }}>
                      {athlete.firstName} {athlete.lastName}
                    </span>

                    {differentAthleteTeam && (
                      <Text c="dimmed" size="sm" style={{
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        textOverflow: 'ellipsis',
                        textDecoration: 'line-through',
                      }}>
                        {differentAthleteTeam.name}
                      </Text>
                    )}
                  </Group>
                </Table.Td>
                <Table.Td style={{ opacity: status === 'removed' ? 0.6 : 1 }}>
                  {athlete.uciId}
                </Table.Td>
                <Table.Td style={{ textAlign: 'right' }}>
                  {status === 'removed' ? (
                    <ActionIcon
                      variant="light"
                      onClick={() => handleRestoreAthlete(athleteUciId)}
                      title="Restore athlete to team"
                    >
                      <IconRestore/>
                    </ActionIcon>
                  ) : (
                    <ActionIcon
                      color="red"
                      variant="light"
                      onClick={() => handleRemoveAthlete(athleteUciId)}
                      title="Remove athlete from team"
                    >
                      <IconSquareX/>
                    </ActionIcon>
                  )}
                </Table.Td>
              </Table.Tr>
            )
          })}

          <Table.Tr>
            <Table.Td colSpan={4}>
              <Select
                placeholder="Add an athlete to the team roster"
                data={availableAthletes}
                value={searchValue}
                searchable
                clearable
                maxDropdownHeight={400}
                onChange={(value) => {
                  if (value) {
                    handleAddAthlete(value)
                  } else {
                    setSearchValue(value)
                  }
                }}
                rightSection={<IconPlus size={16}/>}
              />
            </Table.Td>
          </Table.Tr>
        </Table.Tbody>
      </Table>

      <Group justify="flex-end" mt="md">
        <Button
          type="button"
          variant="light"
          onClick={() => navigate('/admin/teams')}
        >
          Cancel
        </Button>
        <Button
          onClick={handleRosterSubmit}
          loading={saving}
          disabled={addedCount === 0 && removedCount === 0}
        >
          Save Changes
        </Button>
      </Group>
    </Stack>
  )
}