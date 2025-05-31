import type { Athlete, AthleteRaceResult } from '../../types/results'
import { Table, Text } from '@mantine/core'
import { useMemo } from 'react'
import { useDisclosure } from '@mantine/hooks'
import { columns } from '../Shared/columns'

type ResultsTableProps = {
  results: AthleteRaceResult[]
  athletes: Record<string, Athlete>,
  isFiltered: boolean
}

export const ResultsTable: React.FC<ResultsTableProps> = ({
                                                            results,
                                                            athletes,
                                                            isFiltered,
                                                          }) => {
  const [showFinishTimes, { toggle: toggleFinishTimes }] = useDisclosure()

  const rows = useMemo(() => results.map((result) => {
    const athlete = athletes[result.bibNumber]

    return (
      <Table.Tr key={`ranking-${result.bibNumber}`}>
        <Table.Td>{columns.position(result)}</Table.Td>
        <Table.Td>
          {athlete.lastName}, {athlete.firstName}
          <Text size="sm" c="dimmed" hiddenFrom="sm" style={{
            overflow: 'hidden',
            whiteSpace: 'nowrap', textOverflow: 'ellipsis',
          }}>{athlete.team}</Text>
        </Table.Td>
        <Table.Td visibleFrom="sm">{athlete.team}</Table.Td>
        <Table.Td visibleFrom="lg">{columns.city(athlete)}</Table.Td>
        <Table.Td>{columns.bibNumber(result)}</Table.Td>
        <Table.Td style={{ maxWidth: 100, whiteSpace: 'nowrap' }}>
          <div style={{ cursor: 'pointer' }} onClick={() => toggleFinishTimes()}>
            {columns.time(result, { showGapTime: !showFinishTimes && !isFiltered })}
          </div>
        </Table.Td>
      </Table.Tr>
    )
  }), [results, athletes, showFinishTimes])

  return (
    <div style={{ width: '100%' }}>
      <Table style={{ tableLayout: 'fixed' }}>
        <Table.Thead>
          <Table.Tr>
            <Table.Th hiddenFrom="sm" style={{
              width: 40
            }}>P</Table.Th>
            <Table.Th visibleFrom="sm" style={{
              width: 80
            }}>Position</Table.Th>
            <Table.Th>Name</Table.Th>
            <Table.Th visibleFrom="sm">Team</Table.Th>
            <Table.Th visibleFrom="lg">City</Table.Th>
            <Table.Th style={{
              width: 70
            }}>Bib</Table.Th>
            <Table.Th style={{
              width: 80
            }}>Time</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
        {/*<Table.Caption>Scroll page to see sticky thead</Table.Caption>*/}
      </Table>
    </div>
  )
}