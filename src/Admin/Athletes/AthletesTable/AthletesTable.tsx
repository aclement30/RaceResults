import { ActionIcon, Anchor, Group, Pagination, Table } from '@mantine/core'
import { IconExternalLink, IconPencil } from '@tabler/icons-react'
import * as React from 'react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import type { Athlete } from '../../../../shared/types'
import { renderSkillLevelWithAgeCategory } from '../../../Athlete/utils'
import { EmptyState } from '../../../Shared/EmptyState'
import { SearchField } from '../../../Shared/SearchField'

const currentYear = new Date().getFullYear()

type AthletesTableProps = {
  athletes: Athlete[]
}

const ROWS_PER_PAGE = 50

export const AthletesTable: React.FC<AthletesTableProps> = ({ athletes }) => {
  const [searchValue, setSearchValue] = useState('')
  const navigate = useNavigate()
  const [activePage, setPage] = useState<number>(1)

  const sortedAthletes = useMemo(() => {
    const allAthletes: Athlete[] = []

    athletes.forEach(athlete => allAthletes.push(athlete))

    return allAthletes.sort((a, b) => {
      const nameA = `${a.firstName} ${a.lastName}`.toLowerCase()
      const nameB = `${b.firstName} ${b.lastName}`.toLowerCase()
      return nameA.localeCompare(nameB)
    })
  }, [athletes])

  const filteredAthletes = useMemo(() => {
    if (!searchValue) return sortedAthletes

    const searchValueLower = searchValue.toLowerCase().trim()

    return sortedAthletes.filter((athlete) => {
      if (!isNaN(+searchValueLower) && searchValueLower.length === 11) {
        return athlete.uciId === searchValueLower
      } else {
        const { firstName, lastName, teams } = athlete
        const fullName = `${firstName} ${lastName}`.toLowerCase()
        const teamLower = teams?.[currentYear]?.name?.toLowerCase()

        return fullName.includes(searchValueLower) || teamLower?.includes(searchValueLower)
      }
    })
  }, [sortedAthletes, searchValue])

  const rows = useMemo(() => filteredAthletes.slice((activePage - 1) * ROWS_PER_PAGE, activePage * ROWS_PER_PAGE).map((athlete) => {
    const team = athlete.teams?.[currentYear]

    return (
      <Table.Tr key={`athlete-${athlete.uciId}`}>
        <Table.Td>{athlete.uciId}</Table.Td>
        <Table.Td>
          <Anchor onClick={() => window.open(`/athletes/${athlete.uciId}`)} target="_blank">
            {athlete.firstName} {athlete.lastName?.toUpperCase()}
            <span style={{ paddingLeft: 5, top: 2, position: 'relative' }}><IconExternalLink size="1rem"/></span>
          </Anchor>
        </Table.Td>
        <Table.Td>
          {team?.name}
        </Table.Td>
        <Table.Td>{renderSkillLevelWithAgeCategory(athlete)}</Table.Td>
        <Table.Td style={{ textAlign: 'right' }}>
          <ActionIcon variant="subtle" aria-label="Edit"
                      onClick={() => navigate(`/admin/athletes/${athlete.uciId}/edit`)}>
            <IconPencil/>
          </ActionIcon>
        </Table.Td>
      </Table.Tr>
    )
  }), [filteredAthletes, activePage])

  return (
    <>
      <Group style={{ paddingBottom: '1rem', marginTop: '1rem' }}>
        <SearchField value={searchValue} onChange={setSearchValue} placeholder="Search athlete name, team..."/>
      </Group>

      <div style={{ width: '100%' }}>
        {!!rows.length ? (
          <>
            <Table style={{ tableLayout: 'fixed' }} withTableBorder>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th style={{ width: 120 }}>UCI ID</Table.Th>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>Team</Table.Th>
                  <Table.Th>Category</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>{rows}</Table.Tbody>
            </Table>

            <Pagination
              value={activePage}
              onChange={setPage}
              total={Math.ceil(filteredAthletes.length / ROWS_PER_PAGE)}
              style={{ marginTop: '1rem' }}
            />
          </>
        ) : (
          <EmptyState>No athletes matching the selected filters</EmptyState>
        )}
      </div>
    </>
  )
}