import { Blockquote, Button, Divider, Group, Table, Text } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { IconFileDownload } from '@tabler/icons-react'
import debounce from 'lodash/debounce'
import React, { useContext, useMemo, useState } from 'react'
import type { ParticipantResult, RaceEvent } from '../../../shared/types/events'
import { AppContext } from '../../AppContext'
import { RACE_TYPES } from '../../config/event-types'
import { SearchField } from '../../Shared/SearchField'
import { UserFavoriteContext } from '../../UserFavoriteContext'
import { exportCSV } from '../../utils/exportCSV'
import { showErrorMessage } from '../../utils/showErrorMessage'
import { useHighlightedAthlete } from '../../utils/useHighlightedAthlete'
import { useNavigator } from '../../utils/useNavigator'
import { columns } from '../Shared/columns'

type ResultsTableProps = {
  eventSummary: RaceEvent
  results: ParticipantResult[]
}

export const ResultsTable: React.FC<ResultsTableProps> = ({
  eventSummary,
  results,
}) => {
  const { findAthlete } = useContext(AppContext)
  const { isFavorite } = useContext(UserFavoriteContext)
  const [showFinishTimes, { toggle: toggleFinishTimes }] = useDisclosure()
  const [searchValue, setSearchValue] = useState('')
  const [loadingCsv, setLoadingCsv] = useState(false)
  const { navigateToAthlete } = useNavigator()
  const eventYear = +eventSummary.date.slice(0, 4)

  const filteredResults = useMemo(() => {
    if (!searchValue) return results

    const searchValueLower = searchValue.toLowerCase().trim()

    return results.filter((raceResult) => {
      if (isNaN(+searchValueLower)) {
        const { firstName, lastName, team } = raceResult
        const fullName = `${firstName} ${lastName}`.toLowerCase()
        const teamLower = team?.toLowerCase()

        return fullName.includes(searchValueLower) || teamLower?.includes(searchValueLower)
      } else {
        const bibNumber = +searchValueLower
        return raceResult.bibNumber?.toString().startsWith(bibNumber.toString())
      }
    })
  }, [results, searchValue])

  const { highlightedBibNumber, highlightAthlete } = useHighlightedAthlete()

  const isFiltered = filteredResults.length !== results.length

  const athleteColumns = useMemo(() => {
    const athleteColumns = ['name']

    if (results.some(result => !!result.city?.length || !!result.province?.length)) athleteColumns.push('city')
    if (results.some(result => !!result.bibNumber)) athleteColumns.push('bibNumber')
    if (results.some(result => !!result.finishTime)) athleteColumns.push('finishTime')
    if (results.some(result => !!result.avgSpeed)) athleteColumns.push('avgSpeed')

    return athleteColumns
  }, [results])

  const rows = useMemo(() => filteredResults.map((result) => {
    const athleteProfile = findAthlete(result)
    const team = result.team || athleteProfile?.teams?.[eventYear]?.name
    const isFavoriteRow = isFavorite({ athleteUciId: athleteProfile?.uciId, team })

    return (
      <Table.Tr key={`ranking-${result.participantId}`}
                className={`result-row ${highlightedBibNumber && +highlightedBibNumber === result.bibNumber ? ' highlighted' : ''} ${isFavoriteRow ? 'favorite' : ''}`}>
        <Table.Td>{columns.position(result)}</Table.Td>
        <Table.Td>
          {columns.name(athleteProfile || result, { onClick: athleteProfile ? navigateToAthlete : undefined })}
          <Text size="sm" c="dimmed" hiddenFrom="sm" style={{
            overflow: 'hidden',
            whiteSpace: 'nowrap', textOverflow: 'ellipsis',
          }}>{team}</Text>
        </Table.Td>
        <Table.Td visibleFrom="sm">{team}</Table.Td>
        {athleteColumns.includes('city') && <Table.Td visibleFrom="lg">{columns.city(result)}</Table.Td>}
        {athleteColumns.includes('bibNumber') &&
          <Table.Td>{columns.bibNumber(result, { onClick: highlightAthlete })}</Table.Td>}
        {athleteColumns.includes('finishTime') && (
          <Table.Td style={{ maxWidth: 100, whiteSpace: 'nowrap' }}>
            <div style={{ cursor: 'pointer' }} onClick={() => toggleFinishTimes()}>
              {columns.time(result, { showGapTime: !showFinishTimes && !isFiltered })}
            </div>
          </Table.Td>
        )}
        {eventSummary.raceType === RACE_TYPES.TT && athleteColumns.includes('avgSpeed') && (
          <Table.Td style={{ maxWidth: 100, whiteSpace: 'nowrap' }} visibleFrom="sm">
            {columns.avgSpeed(result)}
          </Table.Td>
        )}
      </Table.Tr>
    )
  }), [filteredResults, showFinishTimes, highlightedBibNumber])

  const handleExportCSV = async () => {
    const exportedRows = filteredResults.map((result) => {
      const athleteProfile = findAthlete(result)
      const team = result.team || athleteProfile?.teams?.[eventYear]?.name

      return [
        columns.position(result, { text: true }) as string,
        columns.name(result, { text: true }) as string,
        team,
        result.city,
        result.bibNumber,
        columns.time(result, { showGapTime: false, text: true }) as string,
        columns.gap(result, { text: true })?.replace('+ ', ''),
        eventSummary.raceType === RACE_TYPES.TT ? columns.avgSpeed(result, { text: true }) : ''
      ]
    })

    setLoadingCsv(true)

    try {
      await exportCSV(exportedRows, [
        'Position',
        'Name',
        'Team',
        'City',
        'BibNumber',
        'FinishTime',
        'FinishGap',
        ...(eventSummary.raceType === RACE_TYPES.TT ? ['AvgSpeed'] : [])
      ], 'results')
    } catch (error) {
      // @ts-ignore
      showErrorMessage({ title: 'CSV Export Error', message: error.message })
    } finally {
      setLoadingCsv(false)
    }
  }

  const debouncedSearchTracking = debounce(() => {
    window.umami?.track('search-event-participant')
  }, 1000)

  const handleSearchChange = (searchValue: string) => {
    setSearchValue(searchValue)
    debouncedSearchTracking()
  }

  return (
    <div style={{ width: '100%', marginTop: '1rem' }}>
      <Group style={{ paddingBottom: '1rem' }}>
        <SearchField value={searchValue} onChange={handleSearchChange}/>

        <Button
          variant="default"
          leftSection={<IconFileDownload/>}
          onClick={() => handleExportCSV()}
          data-umami-event="download-event-results-csv"
          loading={loadingCsv}
          visibleFrom="sm"
        >
          Download CSV
        </Button>
      </Group>

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
            <Table.Th visibleFrom="sm">Team</Table.Th>
            {athleteColumns.includes('city') && <Table.Th visibleFrom="lg">City</Table.Th>}
            {athleteColumns.includes('bibNumber') && <Table.Th style={{ width: 70 }}>Bib</Table.Th>}
            {athleteColumns.includes('finishTime') && <Table.Th style={{ width: 100 }}>Time</Table.Th>}
            {eventSummary.raceType === RACE_TYPES.TT && athleteColumns.includes('avgSpeed') && (
              <Table.Th style={{ width: 100 }} visibleFrom="sm">Avg. Speed</Table.Th>
            )}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
        {/*<Table.Caption>Scroll page to see sticky thead</Table.Caption>*/}
      </Table>


      {eventSummary.raceNotes && (
        <>
          <Blockquote color="gray" mt="lg" p="md">
            <div dangerouslySetInnerHTML={{ __html: eventSummary.raceNotes }} style={{ fontSize: 'smaller' }}/>
          </Blockquote>

          <Divider/>
        </>
      )}
    </div>
  )
}