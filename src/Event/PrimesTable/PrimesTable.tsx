import type { EventAthlete, PrimeResult } from '../../types/results'
import { Table, Text } from '@mantine/core'
import { useContext, useMemo } from 'react'
import { columns } from '../Shared/columns'
import { AppContext } from '../../AppContext'
import { useNavigate } from 'react-router'

type PrimesTableProps = {
  primes: PrimeResult[]
  athletes: Record<string, EventAthlete>,
}

export const PrimesTable: React.FC<PrimesTableProps> = ({
  primes,
  athletes,
}) => {
  const { findAthlete } = useContext(AppContext)
  const navigate = useNavigate()

  const showAthleteProfile = (athleteUciId: string) => {
    navigate(`/athletes/${athleteUciId}`)
  }

  const athleteColumns = useMemo(() => {
    const resultAthletes = primes.map((prime) => athletes[prime.athleteId])
    const athleteColumns = ['name']

    if (resultAthletes?.some(result => !!result.team?.length)) athleteColumns.push('team')
    if (resultAthletes?.some(result => !!result.bibNumber)) athleteColumns.push('bibNumber')

    return athleteColumns
  }, [primes, athletes])

  const rows = useMemo(() => primes.map((primeResult) => {
    const eventAthlete = athletes[primeResult.athleteId]
    const athleteProfile = findAthlete(eventAthlete)

    return (
      <Table.Tr key={primeResult.number}>
        <Table.Td>{primeResult.number}</Table.Td>
        <Table.Td>
          {columns.name(athleteProfile || eventAthlete, { onClick: showAthleteProfile })}
          {athleteColumns.includes('team') && (<Text size="sm" c="dimmed" hiddenFrom="sm">{eventAthlete.team}</Text>)}
        </Table.Td>
        {athleteColumns.includes('team') && (<Table.Td visibleFrom="sm">{eventAthlete.team}</Table.Td>)}
        {athleteColumns.includes('bibNumber') && (<Table.Td>{columns.bibNumber(eventAthlete)}</Table.Td>)}
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
            {athleteColumns.includes('team') && (<Table.Th visibleFrom="sm">Team</Table.Th>)}
            {athleteColumns.includes('bibNumber') && (<Table.Th>Bib</Table.Th>)}
            <Table.Th>P<span className="mantine-visible-from-sm">osition</span></Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>
    </>
  )
}