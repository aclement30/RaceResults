import type { SerieSummary, TeamSerieResult } from '../../types/results'
import { Anchor, Table } from '@mantine/core'
import { useContext, useMemo } from 'react'
import { formatRacerPositionLabel } from '../../Event/Shared/columns'
import { ResponsiveTable } from '../../Shared/ResponsiveTable'
import { formatRaceDate } from '../utils'
import { AppContext } from '../../AppContext'
import keyBy from 'lodash/keyBy'
import { useNavigator } from '../../utils/useNavigator'
import { UserFavoriteContext } from '../../UserFavoriteContext'

type TeamRankingsTableProps = {
  serie: SerieSummary
  selectedCategory: string
  results: TeamSerieResult[]
}

export const columns = {
  position: (row: Pick<TeamSerieResult, 'position'>) => {
    if (row.position > 0) return formatRacerPositionLabel(row.position)
    else return null
  },
}

export const TeamRankingsTable: React.FC<TeamRankingsTableProps> = ({
  serie,
  selectedCategory,
  results,
}) => {
  const { navigateToEvent, navigateToSerie } = useNavigator()
  const { events } = useContext(AppContext)
  const { isFavorite } = useContext(UserFavoriteContext)

  const serieEventsByDate = useMemo(() => {
    const yearEvents = events.get(serie.year) || []
    return keyBy(yearEvents.filter((e) => e.serie === serie.alias), 'date')
  }, [events, serie])

  const racePointColumns = results?.[0].racePoints && Object.keys(results?.[0].racePoints).sort() || []

  const rows = useMemo(() => results.map((result) => {
    const isFavoriteRow = isFavorite({ team: result.team })

    return (
      <Table.Tr key={`ranking-${result.position}`} className={`result-row ${isFavoriteRow ? 'favorite' : ''}`}>
        <Table.Td>{columns.position(result)}</Table.Td>
        <Table.Td>
          <Anchor onClick={() => navigateToSerie(serie, { team: result.team })} size="sm">{result.team}</Anchor>
        </Table.Td>
        <Table.Td style={{
          textAlign: 'center',
          fontWeight: 'bold',
          borderInlineStart: 'calc(0.0625rem * var(--mantine-scale)) solid var(--table-border-color)'
        }}>{result.totalPoints}</Table.Td>
        {racePointColumns.map((date) => (
          <Table.Td key={`race-points-${date}`}
                    visibleFrom="sm">{result.racePoints![date] > 0 ? result.racePoints![date] : ''}</Table.Td>
        ))}
      </Table.Tr>
    )
  }), [results])

  const stickyColumnHeaders = <Table.Tr>
    <Table.Th>P<span className="mantine-visible-from-sm">osition</span></Table.Th>
    <Table.Th>Team</Table.Th>
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
                  visibleFrom="sm">
          {matchingEvent ?
            <Anchor
              onClick={() => navigateToEvent(matchingEvent, selectedCategory)} size="sm"
              fw="bold">{formatRaceDate(date)}
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