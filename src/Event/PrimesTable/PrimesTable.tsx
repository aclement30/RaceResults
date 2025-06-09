import type { EventAthlete, PrimeResult } from '../../types/results'
import { Table, Text } from '@mantine/core'
import { useMemo } from 'react'
import { columns } from '../Shared/columns'

type PrimesTableProps = {
  primes: PrimeResult[]
  athletes: Record<string, EventAthlete>,
}

export const PrimesTable: React.FC<PrimesTableProps> = ({
                                                          primes,
                                                          athletes,
                                                        }) => {
  const rows = useMemo(() => primes.map((primeResult) => {
    const athlete = athletes[primeResult.bibNumber]

    return (
      <Table.Tr key={primeResult.number}>
        <Table.Td>{primeResult.number}</Table.Td>
        <Table.Td>
          {athlete.lastName}, {athlete.firstName}
          <Text size="sm" c="dimmed" hiddenFrom="sm">{athlete.team}</Text>
        </Table.Td>
        <Table.Td visibleFrom="sm">{athlete.team}</Table.Td>
        <Table.Td>{columns.bibNumber(primeResult)}</Table.Td>
        <Table.Td>{primeResult.position}</Table.Td>
      </Table.Tr>
    )
  }), [primes, athletes])

  return (
    <>
      <Table stickyHeader stickyHeaderOffset={60}>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>
              <span className="mantine-visible-from-sm">Number</span><span
              className="mantine-hidden-from-sm">#</span>
            </Table.Th>
            <Table.Th>Name</Table.Th>
            <Table.Th visibleFrom="sm">Team</Table.Th>
            <Table.Th>Bib</Table.Th>
            <Table.Th>P<span className="mantine-visible-from-sm">osition</span></Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>
    </>
  )
}