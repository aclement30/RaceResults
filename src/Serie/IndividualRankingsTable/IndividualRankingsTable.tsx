import { Anchor, Table, Text } from '@mantine/core'
import keyBy from 'lodash/keyBy'
import React, { useContext, useMemo } from 'react'
import type { Serie } from '../../../shared/types'
import { AppContext } from '../../AppContext'
import { columns as sharedColumns, formatRacerPositionLabel } from '../../Event/Shared/columns'
import { ResponsiveTable } from '../../Shared/ResponsiveTable'
import { UserFavoriteContext } from '../../UserFavoriteContext'
import { useHighlightedAthlete } from '../../utils/useHighlightedAthlete'
import { useNavigator } from '../../utils/useNavigator'
import type { AggregatedIndividualRanking } from '../Serie'
import { formatRaceDate } from '../utils'

type IndividualRankingsTableProps = {
  serie: Serie
  selectedCategory: string
  standings: AggregatedIndividualRanking[]
  eventDates: string[]
}

export const columns = {
  ...sharedColumns,
  position: (row: Pick<AggregatedIndividualRanking, 'position'>) => formatRacerPositionLabel(row.position),
}

export const IndividualRankingsTable: React.FC<IndividualRankingsTableProps> = ({
  serie,
  selectedCategory,
  standings,
  eventDates,
}) => {
  const { navigateToAthlete, navigateToEvent } = useNavigator()
  const { events, findAthlete } = useContext(AppContext)
  const { isFavorite } = useContext(UserFavoriteContext)

  const serieEventsByDate = useMemo(() => {
    const yearEvents = events.get(serie.year) || []
    return keyBy(yearEvents.filter((e) => e.serie === serie.alias), 'date')
  }, [events, serie])

  const athleteColumns = ['name']
  if (standings.some(standing => !!standing.team?.length)) athleteColumns.push('team')
  if (standings.some(standing => !!standing.bibNumber)) athleteColumns.push('bibNumber')

  const racePointColumns = eventDates.sort()

  const { highlightedBibNumber, highlightAthlete } = useHighlightedAthlete()

  const rows = useMemo(() => standings.map((standing) => {
    const athleteProfile = findAthlete(standing)
    const team = standing.team || athleteProfile?.teams?.[serie.year]?.name
    const isFavoriteRow = isFavorite({ athleteUciId: athleteProfile?.uciId, team })

    return (
      <Table.Tr key={`ranking-${standing.position}`} style={{ height: 42 }}
                className={`result-row ${highlightedBibNumber && +highlightedBibNumber === standing.bibNumber ? 'highlighted' : ''} ${isFavoriteRow ? 'favorite' : ''}`}>
        <Table.Td>{columns.position(standing)}</Table.Td>
        <Table.Td>
          {columns.name(athleteProfile || standing, { onClick: athleteProfile ? navigateToAthlete : undefined })}
          {athleteColumns.includes('team') && <Text size="sm" c="dimmed" hiddenFrom="sm">{standing.team}</Text>}
        </Table.Td>
        <Table.Td visibleFrom="sm">{team}</Table.Td>
        {athleteColumns.includes('bibNumber') &&
          <Table.Td>{columns.bibNumber(standing, { onClick: highlightAthlete })}</Table.Td>}
        <Table.Td
          style={{
            textAlign: 'center',
            fontWeight: 'bold',
            borderInlineStart: 'calc(0.0625rem * var(--mantine-scale)) solid var(--table-border-color)'
          }}>{standing.totalPoints}</Table.Td>
        {racePointColumns.map((date) => (
          <Table.Td key={`race-points-${date}`}
                    style={{ textAlign: 'center' }}
                    visibleFrom="sm">{standing.racePoints[date] > 0 ? standing.racePoints[date] : ''}</Table.Td>
        ))}
      </Table.Tr>
    )
  }), [standings, highlightedBibNumber])

  const stickyColumnHeaders = <Table.Tr>
    <Table.Th>P<span className="mantine-visible-from-sm">osition</span></Table.Th>
    <Table.Th>Name</Table.Th>
    <Table.Th visibleFrom="sm">Team</Table.Th>
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
            onClick={() => {
              window.umami?.track('navigate-to-event-from-serie', {
                event: matchingEvent.hash,
                category: selectedCategory
              })
              navigateToEvent(matchingEvent, selectedCategory)
            }} size="sm" fw="bold">{formatRaceDate(date)}
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
