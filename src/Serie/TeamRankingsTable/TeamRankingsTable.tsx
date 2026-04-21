import { Anchor, Table } from '@mantine/core'
import keyBy from 'lodash/keyBy'
import React, { useContext, useMemo } from 'react'
import type { Serie } from '../../../shared/types'
import { AppContext } from '../../AppContext'
import { formatRacerPositionLabel } from '../../Event/Shared/columns'
import { ResponsiveTable } from '../../Shared/ResponsiveTable'
import { UserFavoriteContext } from '../../UserFavoriteContext'
import { useNavigator } from '../../utils/useNavigator'
import type { AggregatedTeamRanking } from '../Serie'
import { formatRaceDate } from '../utils'

type TeamRankingsTableProps = {
  serie: Serie
  selectedCategory: string
  standings: AggregatedTeamRanking[]
  onlyShowAggregatedPoints?: boolean
}

export const columns = {
  position: (row: Pick<AggregatedTeamRanking, 'position'>) => {
    if (row.position > 0) return formatRacerPositionLabel(row.position)
    else return null
  },
}

export const TeamRankingsTable: React.FC<TeamRankingsTableProps> = ({
  serie,
  selectedCategory,
  standings,
  onlyShowAggregatedPoints,
}) => {
  const { navigateToEvent, navigateToSerie } = useNavigator()
  const { events } = useContext(AppContext)
  const { isFavorite } = useContext(UserFavoriteContext)

  const serieEventsByDate = useMemo(() => {
    if (onlyShowAggregatedPoints) return {}

    const yearEvents = events.get(serie.year) || []
    return keyBy(yearEvents.filter((e) => e.serie === serie.alias), 'date')
  }, [events, serie, onlyShowAggregatedPoints])

  const racePointColumns = standings?.[0]?.racePoints && Object.keys(standings?.[0].racePoints).sort() || []

  const rows = useMemo(() => standings.map((standing) => {
    const isFavoriteRow = isFavorite({ team: standing.team })

    return (
      <Table.Tr key={`ranking-${standing.position}`} className={`result-row ${isFavoriteRow ? 'favorite' : ''}`}>
        <Table.Td>{columns.position(standing)}</Table.Td>
        <Table.Td>
          <Anchor onClick={() => navigateToSerie(serie, { team: standing.team })} size="sm">{standing.team}</Anchor>
        </Table.Td>
        <Table.Td style={{
          textAlign: 'center',
          fontWeight: 'bold',
          borderInlineStart: 'calc(0.0625rem * var(--mantine-scale)) solid var(--table-border-color)'
        }}>{standing.totalPoints}</Table.Td>
        {!onlyShowAggregatedPoints && (
          <>
            {racePointColumns.map((date) => (
              <Table.Td key={`race-points-${date}`}
                        visibleFrom="sm">{standing.racePoints![date] > 0 ? standing.racePoints![date] : ''}</Table.Td>
            ))}
          </>
        )}
      </Table.Tr>
    )
  }), [standings, onlyShowAggregatedPoints])

  const stickyColumnHeaders = <Table.Tr>
    <Table.Th>P<span className="mantine-visible-from-sm">osition</span></Table.Th>
    <Table.Th>Team</Table.Th>
    <Table.Th style={{
      borderInlineStart: 'calc(0.0625rem * var(--mantine-scale)) solid var(--table-border-color)',
      textAlign: 'center'
    }}>Points</Table.Th>
  </Table.Tr>

  let racePointColumnHeaders

  if (!onlyShowAggregatedPoints) {
    racePointColumnHeaders = <Table.Tr>
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
  }

  return (
    <ResponsiveTable stickyColumnHeaders={stickyColumnHeaders}
                     scrollableColumnHeaders={racePointColumnHeaders}>{rows}</ResponsiveTable>
  )
}