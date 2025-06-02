import type { Athlete, AthleteRaceResult, EventSummary } from '../../types/results'
import { Blockquote, Divider, Table, Text } from '@mantine/core'
import { useMemo, useState } from 'react'
import { useDisclosure } from '@mantine/hooks'
import { columns } from '../Shared/columns'
import { SearchField } from '../Shared/SearchField'

type ResultsTableProps = {
  eventSummary: EventSummary
  results: AthleteRaceResult[]
  athletes: Record<string, Athlete>,
  raceNotes: string | null
}

export const ResultsTable: React.FC<ResultsTableProps> = ({
                                                            eventSummary,
                                                            results,
                                                            athletes,
                                                            raceNotes,
                                                          }) => {
  const [showFinishTimes, { toggle: toggleFinishTimes }] = useDisclosure()
  const [searchValue, setSearchValue] = useState('')

  const filteredResults = useMemo(() => {
    if (!searchValue) return results

    const searchValueLower = searchValue.toLowerCase().trim()

    return results.filter((raceResult) => {
      if (isNaN(+searchValueLower)) {
        const { firstName, lastName, team } = athletes[raceResult.bibNumber]
        const fullName = `${firstName} ${lastName}`.toLowerCase()
        const teamLower = team.toLowerCase()

        return fullName.includes(searchValueLower) || teamLower.includes(searchValueLower)
      } else {
        const bibNumber = +searchValueLower
        return raceResult.bibNumber.toString().startsWith(bibNumber.toString())
      }
    })
  }, [results, searchValue])

  const isFiltered = filteredResults.length !== results.length

  const athleteColumns = useMemo(() => {
    const resultAthletes = results.map((raceResult) => athletes[raceResult.bibNumber])
    const athleteColumns = ['name']

    if (resultAthletes.some(result => !!result.team?.length)) athleteColumns.push('team')
    if (resultAthletes.some(result => !!result.city?.length)) athleteColumns.push('city')
    if (resultAthletes.some(result => !!result.bibNumber)) athleteColumns.push('bibNumber')

    return athleteColumns
  }, [results, athletes])

  const rows = useMemo(() => filteredResults.map((result) => {
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
        {athleteColumns.includes('team') && <Table.Td visibleFrom="sm">{athlete.team}</Table.Td>}
        {athleteColumns.includes('city') && <Table.Td visibleFrom="lg">{columns.city(athlete)}</Table.Td>}
        {athleteColumns.includes('bibNumber') && <Table.Td>{columns.bibNumber(result)}</Table.Td>}
        <Table.Td style={{ maxWidth: 100, whiteSpace: 'nowrap' }}>
          <div style={{ cursor: 'pointer' }} onClick={() => toggleFinishTimes()}>
            {columns.time(result, { showGapTime: !showFinishTimes && !isFiltered })}
          </div>
        </Table.Td>
        {eventSummary.isTimeTrial && (
          <Table.Td style={{ maxWidth: 100, whiteSpace: 'nowrap' }}>
            {columns.avgSpeed(result)}
          </Table.Td>
        )}
      </Table.Tr>
    )
  }), [filteredResults, athletes, showFinishTimes])

  return (
    <div style={{ width: '100%', marginTop: '1rem' }}>
      <div style={{ paddingBottom: '1rem' }}>
        <SearchField value={searchValue} onChange={setSearchValue}/>
      </div>

      <Table style={{ tableLayout: 'fixed' }} withTableBorder>
        <Table.Thead>
          <Table.Tr>
            <Table.Th hiddenFrom="sm" style={{
              width: 40
            }}>P</Table.Th>
            <Table.Th visibleFrom="sm" style={{
              width: 80
            }}>Position</Table.Th>
            <Table.Th>Name</Table.Th>
            {athleteColumns.includes('team') && <Table.Th visibleFrom="sm">Team</Table.Th>}
            {athleteColumns.includes('city') && <Table.Th visibleFrom="lg">City</Table.Th>}
            {athleteColumns.includes('bibNumber') && <Table.Th style={{ width: 70 }}>Bib</Table.Th>}
            <Table.Th style={{ width: 100 }}>Time</Table.Th>
            {eventSummary.isTimeTrial && (
              <Table.Th style={{ width: 100 }}>Avg. Speed</Table.Th>
            )}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
        {/*<Table.Caption>Scroll page to see sticky thead</Table.Caption>*/}
      </Table>


      {raceNotes && (
        <>
          <Blockquote color="gray" mt="lg" p="md">
            <div dangerouslySetInnerHTML={{ __html: raceNotes }} style={{ fontSize: 'smaller' }}/>
          </Blockquote>

          <Divider/>
        </>
      )}
    </div>
  )
}