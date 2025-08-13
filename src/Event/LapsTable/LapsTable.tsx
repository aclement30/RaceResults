import type { EventAthlete, AthleteRaceResult } from '../../types/results'
import { Button, Group, SegmentedControl, Switch, Table } from '@mantine/core'
import { useContext, useMemo, useState } from 'react'
import { columns } from '../Shared/columns'
import { formatGapTime, formatSpeed, formatTimeDuration } from '../../utils/race-results'
import { ResponsiveTable } from '../../Shared/ResponsiveTable'
import { exportCSV } from '../../utils/exportCSV'
import { showErrorMessage } from '../../utils/showErrorMessage'
import { IconFileDownload } from '@tabler/icons-react'
import { AppContext } from '../../AppContext'
import { useNavigator } from '../../utils/useNavigator'

type LapsTableProps = {
  lapCount: number
  results: AthleteRaceResult[]
  athletes: Record<string, EventAthlete>
}

const valueGradientColors = [
  '#00FF00',
  '#33FF00',
  '#66FF00',
  '#99FF00',
  '#CCFF00',
  '#FFFF00',
  '#FFCC00',
  '#FF9900',
  '#FF6600',
  '#FF3300',
  '#FF0000'
]

export const LapsTable: React.FC<LapsTableProps> = ({
  lapCount,
  results,
  athletes,
}) => {
  const { findAthlete } = useContext(AppContext)
  const [dataType, setDataType] = useState<'TIME' | 'SPEED' | 'GAP'>('TIME')
  const [loadingCsv, setLoadingCsv] = useState(false)
  const [showColors, setShowColors] = useState(true)
  const { navigateToAthlete } = useNavigator()

  const rankedValues = useMemo(() => {
    let values: number[] = []

    if (dataType === 'TIME') {
      // @ts-ignore
      values = results.map(result => result.lapDurations?.filter(time => time > 0)).flat()
    } else if (dataType === 'SPEED') {
      // @ts-ignore
      values = results.map(result => result.lapSpeeds?.filter(time => time > 0)).flat()
    } else if (dataType === 'GAP') {
      // @ts-ignore
      values = results.map(result => result.lapGaps?.filter(gap => gap !== null && gap >= 0)).flat()
    }

    values = values.sort((a, b) => a - b)

    const groupCount = 10
    const groupSize = Math.ceil(values.length / groupCount)
    const groups = []

    for (let i = 0; i < groupCount; i++) {
      const start = i * groupSize
      const end = start + groupSize
      const groupRange = values.slice(start, end)
      groups.push([Math.min(...groupRange), Math.max(...groupRange)])
    }

    return groups
  }, [results, dataType])

  const getColorForValue = (value: number | undefined | null) => {
    if (value === null || value === undefined || !showColors) return 'transparent'

    for (let i = 0; i < rankedValues.length; i++) {
      const [min, max] = rankedValues[i]
      if (value >= min && value <= max) {
        return valueGradientColors[i]
      }
    }

    return 'transparent'
  }

  const rows = useMemo(() => results.map((result) => {
    const eventAthlete = athletes[result.athleteId]
    const athleteProfile = findAthlete(eventAthlete)

    return (
      <Table.Tr key={result.bibNumber} style={{ height: 42 }}>
        <Table.Td>{columns.position(result)}</Table.Td>
        <Table.Td> {columns.name(athleteProfile || eventAthlete, {
          onClick: athleteProfile ? navigateToAthlete : undefined,
          short: true
        })}</Table.Td>
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
          }}>{result.avgSpeed && result.avgSpeed > 0 ? formatSpeed(result.avgSpeed) : '-'}</Table.Td>
        )}
        {Array(lapCount).fill(0).map((_, i) => (
          <>
            {dataType === 'TIME' && (
              <Table.Td
                style={{
                  whiteSpace: 'nowrap',
                  textAlign: 'center',
                  backgroundColor: getColorForValue(result.lapDurations?.[i]),
                }}
                key={`lap-${i + 1}`}>{result.lapDurations?.[i] ? formatTimeDuration(result.lapDurations![i]) : '-'}</Table.Td>)}
            {dataType === 'SPEED' && (
              <Table.Td
                style={{
                  whiteSpace: 'nowrap',
                  textAlign: 'center',
                  backgroundColor: getColorForValue(result.lapSpeeds?.[i]),
                }}
                key={`lap-${i + 1}`}>{result.lapSpeeds?.[i] ? formatSpeed(result.lapSpeeds![i]) : '-'}</Table.Td>)}
            {dataType === 'GAP' && (
              <Table.Td
                style={{
                  whiteSpace: 'nowrap',
                  textAlign: 'center',
                  backgroundColor: getColorForValue(result.lapGaps?.[i]),
                }}
                key={`lap-${i + 1}`}>{result.lapGaps?.[i] !== null ? formatGapTime(result.lapGaps![i]) : '-'}</Table.Td>)}
          </>
        ))}
      </Table.Tr>
    )
  }), [results, athletes, dataType, showColors])

  const stickyColumnHeaders = <Table.Tr>
    <Table.Th>P<span className="mantine-visible-from-sm">osition</span></Table.Th>
    <Table.Th>Name</Table.Th>
    <Table.Th>Bib</Table.Th>
    {dataType !== 'GAP' && (<Table.Th style={{
      whiteSpace: 'nowrap',
      textAlign: 'center',
      borderInlineStart: 'calc(0.0625rem * var(--mantine-scale)) solid var(--table-border-color)',
    }}>{dataType === 'TIME' ? 'Total Time' : 'Avg Speed'}</Table.Th>)}
  </Table.Tr>

  const lapColumnHeaders = <Table.Tr>
    {Array(lapCount).fill(0).map((_, i) => (
      <Table.Th key={`lap-${i + 1}`}
                style={{ whiteSpace: 'nowrap', textAlign: 'center' }}>Lap {i + 1}</Table.Th>
    ))}
  </Table.Tr>

  const handleExportCSV = async () => {
    const exportedColumns = ['Position', 'Name', 'Team', 'Bib']
    if (dataType === 'TIME') exportedColumns.push('TotalTime')
    else if (dataType === 'SPEED') exportedColumns.push('AvgSpeed')

    Array(lapCount).fill(0).forEach((_, i) => {
      exportedColumns.push(`Lap${i + 1}`)
    })

    const exportedRows = results.map((result) => {
      const athlete = athletes[result.athleteId]
      const row: Array<string | number | undefined | null> = [
        columns.position(result, { text: true }) as string,
        columns.name(athlete, { text: true }) as string,
        athlete.team,
        result.bibNumber,
      ]
      if (dataType === 'TIME') {
        row.push(columns.time(result, { showGapTime: false, text: true }) as string)
      } else if (dataType === 'SPEED') {
        row.push(result.avgSpeed && result.avgSpeed > 0 ? formatSpeed(result.avgSpeed) : null)
      }

      Array(lapCount).fill(0).forEach((_, i) => {
        let value = null

        if (dataType === 'TIME') {
          value = result.lapDurations?.[i] ? formatTimeDuration(result.lapDurations[i]) : null
        } else if (dataType === 'SPEED') {
          value = result.lapSpeeds?.[i] ? formatSpeed(result.lapSpeeds![i]) : null
        } else if (dataType === 'GAP') {
          value = result.lapGaps?.[i] !== null ? formatGapTime(result.lapGaps![i]).replace('+ ', '') : null
        }

        if (value === '-') row.push(null)
        else row.push(value)
      })

      return row
    })

    setLoadingCsv(true)

    try {
      let filename = 'laps'
      if (dataType === 'TIME') filename += '-time'
      else if (dataType === 'SPEED') filename += '-speed'
      else if (dataType === 'GAP') filename += '-gap'

      await exportCSV(exportedRows, exportedColumns, filename)
    } catch (error) {
      // @ts-ignore
      showErrorMessage({ title: 'CSV Export Error', message: error.message })
    } finally {
      setLoadingCsv(false)
    }
  }

  const handleDataTypeChange = (value: 'TIME' | 'SPEED' | 'GAP') => {
    setDataType(value)
    window.umami?.track('change-laps-data-type', { value })
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <Group style={{ marginTop: '1rem', paddingBottom: '1rem' }} justify="space-between">
        <Group>
          <SegmentedControl
            value={dataType}
            // @ts-ignore
            onChange={(value) => handleDataTypeChange(value as const)}
            data={[
              { label: 'Times', value: 'TIME' },
              { label: 'Speed', value: 'SPEED' },
              { label: 'Gaps', value: 'GAP' },
            ]}
          />
          <Switch
            checked={showColors}
            onChange={(e) => setShowColors(e.currentTarget.checked)}
            label="Show Colors"
            visibleFrom="sm"
          />
        </Group>

        <Button
          variant="default"
          leftSection={<IconFileDownload/>}
          onClick={() => handleExportCSV()}
          data-umami-event="download-event-laps-csv"
          loading={loadingCsv}
          visibleFrom="sm"
        >
          Download CSV
        </Button>
      </Group>

      <ResponsiveTable stickyColumnHeaders={stickyColumnHeaders}
                       scrollableColumnHeaders={lapColumnHeaders}>{rows}</ResponsiveTable>
    </div>
  )
}