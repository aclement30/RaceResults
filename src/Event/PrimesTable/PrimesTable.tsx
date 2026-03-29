import type { ParticipantResult, PrimeResult } from '../../../shared/types/events'
import { Table, Text } from '@mantine/core'
import React, { useContext, useMemo } from 'react'
import { columns } from '../Shared/columns'
import { AppContext } from '../../AppContext'
import { useNavigator } from '../../utils/useNavigator'

type PrimesTableProps = {
  participantResults: ParticipantResult[]
  primes: PrimeResult[]
}

export const PrimesTable: React.FC<PrimesTableProps> = ({
  participantResults,
  primes,
}) => {
  const { findAthlete } = useContext(AppContext)
  const { navigateToAthlete } = useNavigator()

  const athleteColumns = useMemo(() => {
    const resultAthletes = primes.map((prime) => participantResults.find(result => result.participantId === prime.participantId)!)
    const athleteColumns = ['name']

    if (resultAthletes?.some(result => !!result.team?.length)) athleteColumns.push('team')
    if (resultAthletes?.some(result => !!result.bibNumber)) athleteColumns.push('bibNumber')

    return athleteColumns
  }, [primes, participantResults])

  const rows = useMemo(() => primes.map((primeResult) => {
    const participant = participantResults.find(result => result.participantId === primeResult.participantId)!
    const athleteProfile = findAthlete(participant)

    return (
      <Table.Tr key={primeResult.number}>
        <Table.Td>{primeResult.number}</Table.Td>
        <Table.Td>
          {columns.name(athleteProfile || participant, { onClick: athleteProfile ? navigateToAthlete : undefined })}
          {athleteColumns.includes('team') && (<Text size="sm" c="dimmed" hiddenFrom="sm">{participant.team}</Text>)}
        </Table.Td>
        {athleteColumns.includes('team') && (<Table.Td visibleFrom="sm">{participant.team}</Table.Td>)}
        {athleteColumns.includes('bibNumber') && (<Table.Td>{columns.bibNumber(participant)}</Table.Td>)}
        <Table.Td>{primeResult.position}</Table.Td>
      </Table.Tr>
    )
  }), [primes, participantResults])

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