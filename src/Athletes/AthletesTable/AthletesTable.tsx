import {
  Anchor, Group,
  Table,
} from '@mantine/core'
import { useContext, useMemo, useState } from 'react'
import { columns } from '../../Event/Shared/columns'
import * as React from 'react'
import { EmptyState } from '../../Shared/EmptyState'
import { AppContext } from '../../AppContext'
import { renderSkillLevelWithAgeCategory } from '../../Athlete/utils'
import { useNavigator } from '../../utils/useNavigator'
import type { Athlete } from '../../types/athletes'
import { SearchField } from '../../Shared/SearchField'

const currentYear = new Date().getFullYear()

type AthletesTableProps = {}

export const AthletesTable: React.FC<AthletesTableProps> = ({}) => {
  const { navigateToAthlete, navigateToTeam } = useNavigator()
  const { athletes } = useContext(AppContext)
  const [searchValue, setSearchValue] = useState('')

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
        const { firstName, lastName, team } = athlete
        const fullName = `${firstName} ${lastName}`.toLowerCase()
        const teamLower = team?.[currentYear]?.name?.toLowerCase()

        return fullName.includes(searchValueLower) || teamLower?.includes(searchValueLower)
      }
    })
  }, [sortedAthletes, searchValue])

  const rows = useMemo(() => filteredAthletes.map((athlete) => {
    const team = athlete.team?.[currentYear]

    return (
      <Table.Tr key={`athlete-${athlete.uciId}`}>
        <Table.Td>
          <Anchor onClick={() => navigateToAthlete(athlete.uciId)}>
            {athlete.firstName} {athlete.lastName?.toUpperCase()}
          </Anchor>
        </Table.Td>
        <Table.Td>{athlete.gender} {athlete.birthYear ? currentYear - athlete.birthYear : ''}</Table.Td>
        <Table.Td>{columns.city(athlete)}</Table.Td>
        <Table.Td>
          {team?.id ? (
            <Anchor onClick={() => navigateToTeam(team.id!)}>
              {team.name}
            </Anchor>
          ) : team?.name}
        </Table.Td>
        <Table.Td>{renderSkillLevelWithAgeCategory(athlete)}</Table.Td>
        <Table.Td>{athlete.uciId}</Table.Td>
      </Table.Tr>
    )
  }), [filteredAthletes])

  return (
    <>
      <Group style={{ paddingBottom: '1rem', marginTop: '1rem' }}>
        <SearchField value={searchValue} onChange={setSearchValue} placeholder="Search participant name, team..."/>
      </Group>

      <div style={{ width: '100%' }}>
        {!!rows.length ? (
          <Table style={{ tableLayout: 'fixed' }} withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th style={{ width: 80 }}>Age</Table.Th>
                <Table.Th>City</Table.Th>
                <Table.Th>Team</Table.Th>
                <Table.Th style={{ width: 120 }}>Category</Table.Th>
                <Table.Th style={{ width: 120 }}>UCI ID</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>{rows}</Table.Tbody>
          </Table>
        ) : (
          <EmptyState>No athletes matching the selected filters</EmptyState>
        )}
      </div>
    </>
  )
}