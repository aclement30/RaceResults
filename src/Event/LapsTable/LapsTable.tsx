import type { Athlete, AthleteRaceResult } from '../../types/results'
import { SegmentedControl, Table } from '@mantine/core'
import { useMemo, useState } from 'react'
import { columns } from '../Shared/columns'
import { formatGapTime, formatSpeed, formatTimeDuration } from '../../utils/race-results'

type LapsTableProps = {
  lapCount: number
  sortedResults: AthleteRaceResult[]
  filteredResults: AthleteRaceResult[]
  athletes: Record<string, Athlete>
}

export const LapsTable: React.FC<LapsTableProps> = ({
                                                      lapCount,
                                                      sortedResults,
                                                      filteredResults,
                                                      athletes,
                                                    }) => {
  const [dataType, setDataType] = useState<'TIME' | 'SPEED' | 'GAP'>('TIME')

  const lapGaps = useMemo(() => {
    const lapGaps: Record<string, Array<number | null>> = {}

    for (let i = 1; i < lapCount + 1; i++) {
      const firstRiderPastTheLine = sortedResults.reduce((prev, curr) => !curr.lapTimes[i] || prev.lapTimes[i] < curr.lapTimes[i] ? prev : curr)

      sortedResults.forEach(({ bibNumber, lapTimes }) => {
        const riderGapInCurrentLap = lapTimes[i] ? lapTimes[i] - firstRiderPastTheLine.lapTimes[i] : null

        if (!lapGaps.hasOwnProperty(bibNumber)) lapGaps[bibNumber] = []
        lapGaps[bibNumber].push(riderGapInCurrentLap)
      })
    }

    return lapGaps
  }, [sortedResults])

  const rows = useMemo(() => filteredResults.map((result) => {
    const athlete = athletes[result.bibNumber]
    return (
      <Table.Tr key={result.bibNumber}>
        <Table.Td>{columns.position(result)}</Table.Td>
        <Table.Td>{athlete.lastName}, {athlete.firstName.substring(0, 1)}.</Table.Td>
        <Table.Td>{columns.bibNumber(result)}</Table.Td>
        {Array(lapCount).fill(0).map((_, i) => (
          <>
            {dataType === 'TIME' && (
              <Table.Td
                key={`lap-${i + 1}`}>{result.lapDurations[i] ? formatTimeDuration(result.lapDurations[i]) : '-'}</Table.Td> )}
            {dataType === 'SPEED' && (
              <Table.Td
                key={`lap-${i + 1}`}>{result.lapSpeeds[i] ? formatSpeed(result.lapSpeeds[i]) : '-'}</Table.Td> )}
            {dataType === 'GAP' && (
              <Table.Td
                key={`lap-${i + 1}`}>{lapGaps[result.bibNumber][i] !== null ? formatGapTime(lapGaps[result.bibNumber][i]!) : '-'}</Table.Td> )}
          </>
        ))}
        {dataType === 'TIME' && (
          <Table.Td>{columns.time(result, { showGapTime: false })}</Table.Td>
        )}
        {dataType === 'SPEED' && (
          <Table.Td>{result.avgSpeed > 0 ? formatSpeed(result.avgSpeed) : '-'}</Table.Td>
        )}
      </Table.Tr>
    )
  }), [filteredResults, athletes, dataType])

  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ margin: '10px 0' }}>
        <SegmentedControl
          value={dataType}
          // @ts-ignore
          onChange={(value) => setDataType(value as const)}
          data={[
            { label: 'Times', value: 'TIME' },
            { label: 'Speed', value: 'SPEED' },
            { label: 'Gaps', value: 'GAP' },
          ]}
        />
      </div>

      <Table stickyHeader stickyHeaderOffset={60}>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Position</Table.Th>
            <Table.Th>Name</Table.Th>
            <Table.Th>Bib</Table.Th>
            {Array(lapCount).fill(0).map((_, i) => (
              <Table.Th key={`lap-${i + 1}`}>Lap {i + 1}</Table.Th>
            ))}
            {dataType !== 'GAP' && ( <Table.Th>{dataType === 'TIME' ? 'Total Time' : 'Avg Speed'}</Table.Th> )}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>
    </div>
  )
}