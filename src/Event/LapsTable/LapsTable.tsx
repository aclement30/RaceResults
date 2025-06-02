import type { Athlete, AthleteRaceResult } from '../../types/results'
import { SegmentedControl, Table } from '@mantine/core'
import { useMemo, useState } from 'react'
import { columns } from '../Shared/columns'
import { formatGapTime, formatSpeed, formatTimeDuration } from '../../utils/race-results'
import { ResponsiveTable } from '../Shared/ResponsiveTable'

type LapsTableProps = {
  lapCount: number
  results: AthleteRaceResult[]
  athletes: Record<string, Athlete>
}

export const LapsTable: React.FC<LapsTableProps> = ({
                                                      lapCount,
                                                      results,
                                                      athletes,
                                                    }) => {
  const [dataType, setDataType] = useState<'TIME' | 'SPEED' | 'GAP'>('TIME')

  const lapGaps = useMemo(() => {
    const lapGaps: Record<string, Array<number | null>> = {}

    for (let i = 1; i < lapCount + 1; i++) {
      const firstRiderPastTheLine = results.reduce((prev, curr) => !curr.lapTimes![i] || prev.lapTimes![i] < curr.lapTimes![i] ? prev : curr)

      results.forEach(({ bibNumber, lapTimes }) => {
        const riderGapInCurrentLap = lapTimes![i] ? lapTimes![i] - firstRiderPastTheLine.lapTimes![i] : null

        if (!lapGaps.hasOwnProperty(bibNumber)) lapGaps[bibNumber] = []
        lapGaps[bibNumber].push(riderGapInCurrentLap)
      })
    }

    return lapGaps
  }, [results])

  const rows = useMemo(() => results.map((result) => {
    const athlete = athletes[result.bibNumber]
    return (
      <Table.Tr key={result.bibNumber} style={{ height: 42 }}>
        <Table.Td>{columns.position(result)}</Table.Td>
        <Table.Td>{athlete.lastName}, {athlete.firstName.substring(0, 1)}.</Table.Td>
        <Table.Td>{columns.bibNumber(result)}</Table.Td>
        {dataType === 'TIME' && (
          <Table.Td style={{
            borderInlineStart: 'calc(0.0625rem * var(--mantine-scale)) solid var(--table-border-color)',
            textAlign: 'center',
            fontWeight: 'bold',
          }}>{columns.time(result, { showGapTime: false })}</Table.Td>
        )}
        {dataType === 'SPEED' && (
          <Table.Td style={{
            borderInlineStart: 'calc(0.0625rem * var(--mantine-scale)) solid var(--table-border-color)',
            textAlign: 'center',
            fontWeight: 'bold',
          }}>{result.avgSpeed > 0 ? formatSpeed(result.avgSpeed) : '-'}</Table.Td>
        )}
        {Array(lapCount).fill(0).map((_, i) => (
          <>
            {dataType === 'TIME' && (
              <Table.Td
                style={{
                  whiteSpace: 'nowrap',
                  textAlign: 'center',
                }}
                key={`lap-${i + 1}`}>{result.lapDurations![i] ? formatTimeDuration(result.lapDurations![i]) : '-'}</Table.Td> )}
            {dataType === 'SPEED' && (
              <Table.Td
                style={{
                  whiteSpace: 'nowrap',
                  textAlign: 'center',
                }}
                key={`lap-${i + 1}`}>{result.lapSpeeds![i] ? formatSpeed(result.lapSpeeds![i]) : '-'}</Table.Td> )}
            {dataType === 'GAP' && (
              <Table.Td
                style={{
                  whiteSpace: 'nowrap',
                  textAlign: 'center',
                }}
                key={`lap-${i + 1}`}>{lapGaps[result.bibNumber][i] !== null ? formatGapTime(lapGaps[result.bibNumber][i]!) : '-'}</Table.Td> )}
          </>
        ))}
      </Table.Tr>
    )
  }), [results, athletes, dataType])

  const stickyColumnHeaders = <Table.Tr>
    <Table.Th>P<span className="mantine-visible-from-sm">osition</span></Table.Th>
    <Table.Th>Name</Table.Th>
    <Table.Th>Bib</Table.Th>
    {dataType !== 'GAP' && ( <Table.Th style={{
      whiteSpace: 'nowrap',
      textAlign: 'center',
      borderInlineStart: 'calc(0.0625rem * var(--mantine-scale)) solid var(--table-border-color)',
    }}>{dataType === 'TIME' ? 'Total Time' : 'Avg Speed'}</Table.Th> )}
  </Table.Tr>

  const lapColumnHeaders = <Table.Tr>
    {Array(lapCount).fill(0).map((_, i) => (
      <Table.Th key={`lap-${i + 1}`}
                style={{ whiteSpace: 'nowrap', textAlign: 'center' }}>Lap {i + 1}</Table.Th>
    ))}
  </Table.Tr>

  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ margin: '1rem 0' }}>
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

      <ResponsiveTable stickyColumnHeaders={stickyColumnHeaders}
                       scrollableColumnHeaders={lapColumnHeaders}>{rows}</ResponsiveTable>
    </div>
  )
}