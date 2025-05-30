import type { SerieSummary, TeamSerieResult } from '../../types/results'
import { Anchor, Table } from '@mantine/core'
import { useMemo } from 'react'
import { formatRacerPositionLabel } from '../../Event/Shared/columns'
import { useNavigate, useSearchParams } from 'react-router'
import { ResponsiveTable } from '../../Event/Shared/ResponsiveTable'
import { formatRaceDate } from '../utils'

type TeamRankingsTableProps = {
  serie: SerieSummary
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
                                                                      results,
                                                                    }) => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const handleSelectTeam = (teamName: string) => {
    const updatedParams = new URLSearchParams(searchParams)
    updatedParams.set('team', teamName)
    navigate(`/series/${serie.year}/${serie.hash}/individual?${updatedParams.toString()}`)
  }

  const racePointColumns = results?.[0].racePoints && Object.keys(results?.[0].racePoints).sort() || []

  const rows = useMemo(() => results.map((result) => {
    return (
      <Table.Tr key={`ranking-${result.position}`}>
        <Table.Td>{columns.position(result)}</Table.Td>
        <Table.Td>
          <Anchor onClick={() => handleSelectTeam(result.team)} size="sm">{result.team}</Anchor>
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
    {racePointColumns.map((date) => (
      <Table.Th key={`race-${date}`}
                style={{ whiteSpace: 'nowrap', textAlign: 'center' }}
                visibleFrom="sm">{formatRaceDate(date)}</Table.Th>
    ))}
  </Table.Tr>

  return (
    <ResponsiveTable stickyColumnHeaders={stickyColumnHeaders}
                     scrollableColumnHeaders={racePointColumnHeaders}>{rows}</ResponsiveTable>
  )
}