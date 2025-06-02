import type { Athlete, AthleteRaceResult } from '../../types/results'
import { Alert, List, Table, Text, ThemeIcon } from '@mantine/core'
import { useMemo } from 'react'
import {
  calculateBCUpgradePoints,
  getSanctionedEventType,
  getSanctionedEventTypeLabel, hasDoubleUpgradePoints,
  hasUpgradePoints
} from '../utils'
import type { EventSummary } from '../../types/results'
import { columns } from '../Shared/columns'
import { IconCircleCheck } from '@tabler/icons-react'

type PointsTableProps = {
  eventSummary: EventSummary
  results: AthleteRaceResult[]
  athletes: Record<string, Athlete>,
}

export const PointsTable: React.FC<PointsTableProps> = ({
                                                          eventSummary,
                                                          results,
                                                          athletes,
                                                        }) => {
  const fieldSize = useMemo(() => {
    return results.filter((result) => result.status !== 'DNS').length
  }, [results])

  const upgradePoints = useMemo(() => {
    return results.reduce((acc, result) => {
      let points: number | null = 0

      if (result.position > 0) {
        points = calculateBCUpgradePoints({
          position: result.position,
          fieldSize,
          event: eventSummary,
        })
      }

      acc[result.bibNumber] = points

      return acc
    }, {} as Record<string, number | null>)
  }, [results, athletes])

  const pointType = hasUpgradePoints(eventSummary)
  const sanctionedEventType = getSanctionedEventType(eventSummary)
  const doubleUpgradePoints = sanctionedEventType && hasDoubleUpgradePoints(sanctionedEventType)
  const eventTypeLabel = sanctionedEventType ? getSanctionedEventTypeLabel(sanctionedEventType) : null

  const rows = useMemo(() => results.filter(result => !!upgradePoints[result.bibNumber]).map((result) => {
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
        <Table.Td style={{ textAlign: 'center' }}>{upgradePoints[result.bibNumber]}</Table.Td>
      </Table.Tr>
    )
  }), [results, athletes, upgradePoints])

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
        <List.Item>Field Size: {fieldSize} {fieldSize < results.length && '(excluding DNS)'}</List.Item>
        {eventTypeLabel && <List.Item>Event
          Type: {eventTypeLabel} {doubleUpgradePoints && '(double upgrade points)'}</List.Item>}
      </List>
    )
  }, [fieldSize, results.length, eventTypeLabel, doubleUpgradePoints])

  return (
    <div style={{ width: '100%', marginTop: '1rem' }}>
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