import type { RaceEvent } from '../../utils/loadStartupData'
import type {EventResult} from '../../types/results'
import {Badge, Table, Tooltip} from '@mantine/core'
import { useMemo} from 'react'
import {formatFinishTime, formatGapTime} from '../../utils/race-results'
import {useDisclosure} from '@mantine/hooks'

type CategoryResultsTableProps = {
  event: RaceEvent
  results: EventResult
  categoryAlias?: string
  searchValue?: string
}

export const CategoryResultsTable: React.FC<CategoryResultsTableProps> = ({ event, results, categoryAlias: selectedCategoryAlias, searchValue }) => {
  const [showFinishTimes, { toggle: toggleFinishTimes }] = useDisclosure()

  const selectedCategory = results.categories.find((cat) => cat.alias === selectedCategoryAlias)
  const sortedResults = useMemo(()=> {
    const finishers = results.data.filter((racerResult) => racerResult.category === selectedCategoryAlias && racerResult.status === 'FINISHER')

    let sortedResults = [...finishers].sort((a, b) => a.position - b.position)

    const nonFinishers = results.data.filter((racerResult) => racerResult.category === selectedCategoryAlias && racerResult.status === 'DNF')
    sortedResults = [...sortedResults, ...nonFinishers]

    const nonStarters = results.data.filter((racerResult) => racerResult.category === selectedCategoryAlias && racerResult.status === 'DNS')
    sortedResults = [...sortedResults, ...nonStarters]

    return sortedResults
  }, [results.data, selectedCategoryAlias])

  const formatRacerPositionLabel = (position: number) => {
    if (position > 3) return position

    const badgeColour = position === 1 ? 'gold' : position === 2 ? 'silver' : 'brown'

    return <Badge color={badgeColour} style={{ paddingLeft: 6, paddingRight: 5 }}>{position}</Badge>
  }

  const filteredResults = useMemo(() => {
    if (!searchValue) return sortedResults

    const searchValueLower = searchValue.toLowerCase().trim()

    return sortedResults.filter((racerResult) => {
      if (isNaN(+searchValueLower)) {
        const { firstName, lastName, team } = racerResult
        const fullName = `${firstName} ${lastName}`.toLowerCase()
        const teamLower = team.toLowerCase()

        return fullName.includes(searchValueLower) || teamLower.includes(searchValueLower)
      } else {
        const bibNumber = +searchValueLower
        return racerResult.bibNumber.toString().startsWith(bibNumber.toString())
      }
    })
  }, [sortedResults, searchValue])

  const rows = useMemo(() => filteredResults.map((racerResult) => (
    <Table.Tr key={racerResult.bibNumber}>
      <Table.Td>{racerResult.status === 'FINISHER' ? formatRacerPositionLabel(racerResult.position) : racerResult.status}</Table.Td>
      <Table.Td>{racerResult.lastName}, {racerResult.firstName}</Table.Td>
      <Table.Td>{racerResult.team}</Table.Td>
      <Table.Td>{racerResult.city}, {racerResult.state}</Table.Td>
      <Table.Td>
        <Badge
          size="lg"
          variant="gradient"
          gradient={{ from: 'blue', to: 'cyan', deg: 90 }}
          style={{ borderRadius: 5 }}
        >
          {racerResult.bibNumber}
        </Badge>
      </Table.Td>
      <Table.Td>
        {racerResult.status === 'FINISHER' && (
          <>
            {(racerResult.position === 1 || showFinishTimes) ?
              <span style={{ cursor: 'pointer' }} onClick={() => toggleFinishTimes()}>
                {formatFinishTime(racerResult.finishTime)}
              </span>
              :
              <Tooltip label={formatFinishTime(racerResult.finishTime)}>
                <span style={{ cursor: 'pointer' }} onClick={() => toggleFinishTimes()}>
                  {formatGapTime(racerResult.gapValue)}
                </span>
              </Tooltip>
            }
          </>
        )}

        {racerResult.status !== 'FINISHER' && '-'}
      </Table.Td>
    </Table.Tr>
  )), [filteredResults, showFinishTimes])

  return (
    <Table stickyHeader stickyHeaderOffset={60}>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Position</Table.Th>
          <Table.Th>Name</Table.Th>
          <Table.Th>Team</Table.Th>
          <Table.Th>City</Table.Th>
          <Table.Th>Bib</Table.Th>
          <Table.Th>Time</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>{rows}</Table.Tbody>
      {/*<Table.Caption>Scroll page to see sticky thead</Table.Caption>*/}
    </Table>
  );
}