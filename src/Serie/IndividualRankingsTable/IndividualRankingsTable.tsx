import type { AthleteSerieResult, EventSummary, SerieSummary } from '../../types/results'
import { Anchor, Table, Text } from '@mantine/core'
import { useContext, useMemo } from 'react'
import { formatRacerPositionLabel, columns as sharedColumns } from '../../Event/Shared/columns'
import { ResponsiveTable } from '../../Event/Shared/ResponsiveTable'
import { formatRaceDate } from '../utils'
import { AppContext } from '../../AppContext'
import keyBy from 'lodash/keyBy'
import { useNavigate } from 'react-router'
import { useHighlightedAthlete } from '../../utils/useHighlightedAthlete'

type IndividualRankingsTableProps = {
  serie: SerieSummary
  selectedCategory: string
  results: AthleteSerieResult[]
}

export const columns = {
  ...sharedColumns,
  position: (row: Pick<AthleteSerieResult, 'position'>) => formatRacerPositionLabel(row.position),
}

export const IndividualRankingsTable: React.FC<IndividualRankingsTableProps> = ({
                                                                                  serie,
                                                                                  selectedCategory,
                                                                                  results,
                                                                                }) => {
  const navigate = useNavigate()
  const { events } = useContext(AppContext)

  const serieEventsByDate = useMemo(() => {
    const yearEvents = events.get(serie.year) || []
    return keyBy(yearEvents.filter((e) => e.series === serie.alias), 'date')
  }, [events, serie])

  const athleteColumns = ['name']
  if (results.some(result => !!result.team?.length)) athleteColumns.push('team')
  if (results.some(result => !!result.bibNumber)) athleteColumns.push('bibNumber')

  const racePointColumns = results?.[0] && Object.keys(results[0].racePoints).sort() || []

  const handleSelectEvent = (event: EventSummary) => {
    navigate(`/events/${event.year}/${event.hash}?category=${selectedCategory}`)
  }

  const { highlightedBibNumber, highlightAthlete } = useHighlightedAthlete()

  const rows = useMemo(() => results.map((result) => {
    return (
      <Table.Tr key={`ranking-${result.position}`} style={{ height: 42 }}
                className={`result-row ${highlightedBibNumber && +highlightedBibNumber === result.bibNumber ? 'highlighted' : ''}`}>
        <Table.Td>{columns.position(result)}</Table.Td>
        <Table.Td>
          {result.lastName.toUpperCase()}, {result.firstName}
          {athleteColumns.includes('team') && <Text size="sm" c="dimmed" hiddenFrom="sm">{result.team}</Text>}
        </Table.Td>
        {athleteColumns.includes('team') && <Table.Td visibleFrom="sm">{result.team}</Table.Td>}
        {athleteColumns.includes('bibNumber') &&
          <Table.Td>{columns.bibNumber(result, { onClick: highlightAthlete })}</Table.Td>}
        <Table.Td
          style={{
            textAlign: 'center',
            fontWeight: 'bold',
            borderInlineStart: 'calc(0.0625rem * var(--mantine-scale)) solid var(--table-border-color)'
          }}>{result.totalPoints}</Table.Td>
        {racePointColumns.map((date) => (
          <Table.Td key={`race-points-${date}`}
                    style={{ textAlign: 'center' }}
                    visibleFrom="sm">{result.racePoints[date] > 0 ? result.racePoints[date] : ''}</Table.Td>
        ))}
      </Table.Tr>
    )
  }), [results, highlightedBibNumber])

  const stickyColumnHeaders = <Table.Tr>
    <Table.Th>P<span className="mantine-visible-from-sm">osition</span></Table.Th>
    <Table.Th>Name</Table.Th>
    {athleteColumns.includes('team') && <Table.Th visibleFrom="sm">Team</Table.Th>}
    {athleteColumns.includes('bibNumber') && <Table.Th>Bib</Table.Th>}
    <Table.Th style={{
      borderInlineStart: 'calc(0.0625rem * var(--mantine-scale)) solid var(--table-border-color)',
      textAlign: 'center'
    }}>Points</Table.Th>
  </Table.Tr>

  const racePointColumnHeaders = <Table.Tr>
    {racePointColumns.map((date) => {
      const matchingEvent = serieEventsByDate[date]
      return (
        <Table.Th key={`race-${date}`}
                  style={{ whiteSpace: 'nowrap', textAlign: 'center' }}
                  visibleFrom="sm">{matchingEvent ?
          <Anchor
            onClick={() => handleSelectEvent(matchingEvent)} size="sm" fw="bold">{formatRaceDate(date)}
          </Anchor> : formatRaceDate(date)}
        </Table.Th>
      )
    })}
  </Table.Tr>

  return (
    <ResponsiveTable stickyColumnHeaders={stickyColumnHeaders}
                     scrollableColumnHeaders={racePointColumnHeaders}>{rows}</ResponsiveTable>
  )
}
