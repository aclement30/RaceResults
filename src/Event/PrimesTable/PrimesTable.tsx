import type { Athlete, PrimeResult } from '../../types/results'
import { Table } from '@mantine/core'
import { useMemo } from 'react'
import { columns } from '../Shared/columns'

type PrimesTableProps = {
  primes: PrimeResult[]
  athletes: Record<string, Athlete>,
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
        <Table.Td>{athlete.lastName}, {athlete.firstName}</Table.Td>
        <Table.Td>{athlete.team}</Table.Td>
        <Table.Td>{columns.bibNumber(primeResult)}</Table.Td>
        <Table.Td>{columns.position({ ...primeResult, status: 'FINISHER' })}</Table.Td>
      </Table.Tr>
    )
  }), [primes, athletes])

  return (
    <>
      <Table stickyHeader stickyHeaderOffset={60}>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Number</Table.Th>
            <Table.Th>Name</Table.Th>
            <Table.Th>Team</Table.Th>
            <Table.Th>Bib</Table.Th>
            <Table.Th>Position</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>
    </>
  )
}