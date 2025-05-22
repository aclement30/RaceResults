import type { Athlete, AthleteRaceResult } from '../../types/results'
import { Table, Text } from '@mantine/core'
import { useMemo } from 'react'
import { useDisclosure } from '@mantine/hooks'
import { columns } from '../Shared/columns'

type CategoryResultsTableProps = {
  results: AthleteRaceResult[]
  athletes: Record<string, Athlete>,
}

export const CategoryResultsTable: React.FC<CategoryResultsTableProps> = ({
                                                                            results,
                                                                            athletes,
                                                                          }) => {
  const [showFinishTimes, { toggle: toggleFinishTimes }] = useDisclosure()

  const rows = useMemo(() => results.map((result) => {
    const athlete = athletes[result.bibNumber]

    const isFiltered = true

    return (
      <Table.Tr key={result.bibNumber}>
        <Table.Td>{columns.position(result)}</Table.Td>
        <Table.Td>
          {athlete.lastName}, {athlete.firstName}
          <Text size="sm" c="dimmed" hiddenFrom="sm">{athlete.team}</Text>
        </Table.Td>
        <Table.Td visibleFrom="sm">{athlete.team}</Table.Td>
        <Table.Td visibleFrom="lg">{columns.city(athlete)}</Table.Td>
        <Table.Td>{columns.bibNumber(result)}</Table.Td>
        <Table.Td>
          <div style={{ cursor: 'pointer' }} onClick={() => toggleFinishTimes()}>
            {columns.time(result, { showGapTime: !showFinishTimes && !isFiltered })}
          </div>
        </Table.Td>
      </Table.Tr>
    )
  }), [results, athletes, showFinishTimes])

  return (
    <Table stickyHeader stickyHeaderOffset={60}>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Position</Table.Th>
          <Table.Th>Name</Table.Th>
          <Table.Th visibleFrom="sm">Team</Table.Th>
          <Table.Th visibleFrom="lg">City</Table.Th>
          <Table.Th>Bib</Table.Th>
          <Table.Th>Time</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>{rows}</Table.Tbody>
      {/*<Table.Caption>Scroll page to see sticky thead</Table.Caption>*/}
    </Table>
  )
}