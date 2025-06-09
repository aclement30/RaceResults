import { Alert, Button, Group, List, Table, Text, ThemeIcon } from '@mantine/core'
import { useMemo, useState } from 'react'
import { IconCircleCheck, IconFileDownload } from '@tabler/icons-react'
import {
  getSanctionedEventTypeLabel,
  hasUpgradePoints, useCategoryResults
} from '../utils'
import type { EventSummary, EventAthlete, EventResults } from '../../types/results'
import { columns } from '../Shared/columns'
import { exportCSV } from '../../utils/exportCSV'
import { showErrorMessage } from '../../utils/showErrorMessage'

type PointsTableProps = {
  eventSummary: EventSummary
  eventResults: EventResults
  selectedCategory: string
  athletes: Record<string, EventAthlete>,
}

export const PointsTable: React.FC<PointsTableProps> = ({
                                                          eventSummary,
                                                          eventResults,
                                                          selectedCategory,
                                                          athletes,
                                                        }) => {
  const {
    sortedResults,
  } = useCategoryResults(eventResults?.results[selectedCategory]?.results || [], eventResults?.athletes || {})

  const pointType = hasUpgradePoints(eventSummary)
  const eventTypeLabel = getSanctionedEventTypeLabel(eventSummary.sanctionedEventType)
  const [loadingCsv, setLoadingCsv] = useState(false)

  const filteredResults = useMemo(() => {
    return sortedResults.filter(result => !!result.upgradePoints)
  }, [sortedResults])

  const rows = useMemo(() => filteredResults.map((result) => {
    const athlete = athletes[result.bibNumber]

    return (
      <Table.Tr key={`ranking-${result.bibNumber}`}>
        <Table.Td>{columns.position(result)}</Table.Td>
        <Table.Td>
          {athlete.lastName}, {athlete.firstName}
          <Text size="sm" c="dimmed" hiddenFrom="sm" style={{
            overflow: 'hidden',
            whiteSpace: 'nowrap', textOverflow: 'ellipsis',
          }}>{athlete.team}</Text>
        </Table.Td>
        <Table.Td visibleFrom="sm">{athlete.team}</Table.Td>
        <Table.Td>{columns.bibNumber(result)}</Table.Td>
        <Table.Td style={{ textAlign: 'center' }}>{result.upgradePoints}</Table.Td>
      </Table.Tr>
    )
  }), [filteredResults, athletes])

  const handleExportCSV = async () => {
    const exportedRows = filteredResults.map((result) => {
      const athlete = athletes[result.bibNumber]
      return [
        columns.position(result, { text: true }) as string,
        `${athlete.lastName}, ${athlete.firstName}`,
        athlete.team,
        result.bibNumber,
        result.upgradePoints,
      ]
    })

    setLoadingCsv(true)

    try {
      await exportCSV(exportedRows, [
        'Position',
        'Name',
        'Team',
        'BibNumber',
        'Points',
      ], 'points')
    } catch (error) {
      showErrorMessage({ title: 'CSV Export Error', message: (error as any).message })
    } finally {
      setLoadingCsv(false)
    }
  }

  const PointExplanation = useMemo(() => {
    return (
      <List
        spacing="xs"
        size="sm"
        center
        style={{ marginTop: '1rem' }}
        icon={
          <ThemeIcon color="teal" size={16} radius="xl">
            <IconCircleCheck size={16}/>
          </ThemeIcon>
        }
      >
        <List.Item>Field
          Size: {eventResults.results[selectedCategory].fieldSize} ({eventResults.results[selectedCategory].combinedCategories?.map(cat => eventResults.results[cat].label).join(' + ') + ', '}excluding
          DNS)</List.Item>
        {eventTypeLabel && <List.Item>Event
            Type: {eventTypeLabel} {eventSummary.isDoubleUpgradePoints && '(double upgrade points)'}</List.Item>}
      </List>
    )
  }, [sortedResults.length, eventTypeLabel, eventSummary])

  return (
    <div style={{ width: '100%', marginTop: '1rem' }}>
      <Group style={{ paddingBottom: '1rem', justifyContent: 'flex-end' }} visibleFrom="sm">
        <Button
          variant="default"
          leftSection={<IconFileDownload/>}
          onClick={() => handleExportCSV()}
          loading={loadingCsv}>
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
            <Table.Th style={{
              width: 70
            }}>Bib</Table.Th>
            <Table.Th style={{
              width: 100,
              textAlign: 'center',
            }}>Points</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
        {/*<Table.Caption>Scroll page to see sticky thead</Table.Caption>*/}
      </Table>

      {pointType === 'UPGRADE' && (
        <Alert variant="light" color="blue" style={{ margin: '1rem 0' }} title="Upgrade Points">
          Upgrade points are awarded based on the Cycling BC Upgrade Points Schedule and the finishing position of each
          athletes. This is an estimate and may not reflect the final points awarded by Cycling BC.

          {PointExplanation}
        </Alert>
      )}

      {pointType === 'SUBJECTIVE' && (
        <Alert variant="light" color="blue" style={{ margin: '1rem 0' }} title="Subjective Upgrade Points">
          Subjective upgrade points are awarded based on the Cycling BC Upgrade Points Schedule and the finishing
          position of each
          athletes. This is an estimate and may not reflect the final points awarded by Cycling BC.

          {PointExplanation}
        </Alert>
      )}
    </div>
  )
}