import {
  Anchor,
  Group,
  Table,
  Text,
} from '@mantine/core'
import { useMemo } from 'react'
import type { AthleteRace } from '../../types/athletes'
import { useNavigate, useSearchParams } from 'react-router'
import { columns } from '../../Event/Shared/columns'
import { Dropdown } from '../../Shared/Dropdown'
import * as React from 'react'
import { EmptyState } from '../../Shared/EmptyState'

type RacesTableProps = {
  races?: AthleteRace[]
}

export const RacesTable: React.FC<RacesTableProps> = ({
  races,
}) => {
  const navigate = useNavigate()

  const [searchParams, setSearchParams] = useSearchParams()
  const selectedYear = searchParams.get('year') ? +searchParams.get('year')! : undefined
  const selectedDiscipline: 'ROAD' | 'CX' = (searchParams.get('discipline') || 'ROAD') as 'ROAD' | 'CX'

  const allDisciplines = useMemo(() => [...new Set(races?.map(r => r.discipline) || [])], [races])
  const allYears = useMemo(() => [...new Set(races?.map(r => +r.date.slice(0, 4)) || [])].sort().reverse(), [races])

  const filteredRaces = useMemo(() => races?.filter(r => r.discipline === selectedDiscipline && r.date.startsWith(selectedYear?.toString() || allYears[0]?.toString())) || [], [
    races,
    selectedDiscipline,
    selectedYear,
    allYears,
  ])

  const handleSelectDiscipline = (discipline: 'ROAD' | 'CX') => {
    const updatedParams = new URLSearchParams(searchParams)
    updatedParams.set('discipline', discipline)
    setSearchParams(updatedParams)
  }

  const handleSelectYear = (year: number) => {
    const updatedParams = new URLSearchParams(searchParams)
    updatedParams.set('year', year.toString())
    setSearchParams(updatedParams)
  }

  const rows = useMemo(() => filteredRaces.sort((a, b) => b.date > a.date ? 1 : -1).map((race) => {
    const year = +race.date.slice(0, 4)

    return (
      <Table.Tr key={`race-${race.eventHash}`}>
        <Table.Td visibleFrom="sm">{race.date}</Table.Td>
        <Table.Td style={{
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          textOverflow: 'ellipsis'
        }}>
          <Anchor
            onClick={() => navigate(`/events/${year}/${race.eventHash}?category=${race.category}`)}>
            {race.eventName}
          </Anchor>
          <Text c="dimmed" size="sm" hiddenFrom="sm">{race.date}</Text>
        </Table.Td>
        <Table.Td visibleFrom="xs">{race.categoryLabel}</Table.Td>
        <Table.Td style={{ textAlign: 'center' }}>{columns.position({
          position: race.position,
          status: race.status,
        })}</Table.Td>
      </Table.Tr>
    )
  }), [filteredRaces])

  return (
    <div style={{ width: '100%', marginTop: '1rem' }}>
      <Group
        style={{ paddingBottom: '1rem', display: allDisciplines.length > 1 || allYears.length > 1 ? 'flex' : 'none' }}>
        {allDisciplines.length > 1 && (
          <Dropdown
            items={[
              { value: 'ROAD', label: 'Road' },
              { value: 'CX', label: 'Cyclocross' }
            ]}
            size="sm"
            onSelect={handleSelectDiscipline}
            value={selectedDiscipline}
          />
        )}

        {allYears.length > 1 && (
          <Dropdown
            items={allYears.map(year => ({ value: year, label: year.toString() }))}
            size="sm"
            onSelect={handleSelectYear}
            value={selectedYear}
          />
        )}
      </Group>

      {!!filteredRaces.length ? (
        <Table style={{ tableLayout: 'fixed' }} withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th style={{ width: 110 }} visibleFrom="sm">Date</Table.Th>
              <Table.Th>Race</Table.Th>
              <Table.Th visibleFrom="xs" hiddenFrom="xl" style={{ width: 150 }}>Category</Table.Th>
              <Table.Th visibleFrom="xl" style={{ width: 200 }}>Category</Table.Th>
              <Table.Th hiddenFrom="sm" style={{
                width: 60,
                textAlign: 'center'
              }}>P</Table.Th>
              <Table.Th visibleFrom="sm" style={{
                width: 80,
                textAlign: 'center'
              }}>Position</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>{rows}</Table.Tbody>
        </Table>
      ) : (
        <EmptyState>No races {races && races.length > 0 ? 'matching the selected filters' : ''}</EmptyState>
      )}
    </div>
  )
}