import { Button, Group, Table } from '@mantine/core'
import { IconListNumbers, IconPlus, IconUpload } from '@tabler/icons-react'
import React, { useCallback, useContext } from 'react'
import type { ParticipantResult, PrimeResult } from '../../../../../shared/types'
import { EmptyState } from '../../../../Shared/EmptyState'
import type { SortColumn } from '../EventIndividualStandings/EventIndividualStandings'
import { SerieEventFormContext } from '../EventIndividualStandings/SerieEventFormContext'
import { SortableHeader } from './SortableHeader/SortableHeader'
import { EventStandingRow } from './StandingRow/EventStandingRow'

type SerieEventStandingsTableProps = {
  raceEventResults: ParticipantResult[]
  raceEventPrimes: PrimeResult[]
  sortColumn: SortColumn
  onSortChange: (column: SortColumn) => void
  onPointChange: () => void
  onOpenFileUpload: () => void
}

export const SerieEventStandingsTable: React.FC<SerieEventStandingsTableProps> = ({
  raceEventResults,
  raceEventPrimes,
  sortColumn,
  onSortChange,
  onPointChange,
  onOpenFileUpload,
}) => {
  const formRef = useContext(SerieEventFormContext)!

  const handleAddRow = useCallback(() => {
    formRef.current.insertListItem('standings', {
      participantId: `p-${Date.now()}`,
      firstName: '',
      lastName: '',
      points: 0,
    })
  }, [])

  const handleDeleteRow = useCallback((participantId: string) => {
    const standings = formRef.current.getValues().standings
    const index = standings.findIndex(standing => standing.participantId === participantId)
    if (index !== -1) formRef.current.removeListItem('standings', index)
  }, [])

  const form = formRef.current
  const standings = form.getValues().standings

  if (standings.length === 0) {
    return (
      <EmptyState
        icon={<IconListNumbers size={28} color="var(--mantine-color-gray-5)"/>}
        text="No standings yet"
        button={
          <Group mt="xs">
            <Button size="sm" leftSection={<IconPlus size={14}/>} onClick={handleAddRow}>
              Add Participant
            </Button>
            <Button
              size="sm"
              leftSection={<IconUpload size={14}/>}
              onClick={onOpenFileUpload}
            >
              Upload File
            </Button>
          </Group>
        }
      />
    )
  }

  return (
    <>
      <Table striped highlightOnHover horizontalSpacing={4} verticalSpacing={4}>
        <Table.Thead>
          <Table.Tr>
            <Table.Th w={40}>Pos</Table.Th>
            <Table.Th>Bib</Table.Th>
            <Table.Th>Name</Table.Th>
            <Table.Th>UCI ID</Table.Th>
            <Table.Th>Team</Table.Th>
            <Table.Th>
              <SortableHeader
                label="Points"
                column="points"
                activeColumn={sortColumn}
                direction="desc"
                onClick={onSortChange}
              />
            </Table.Th>
            {!!raceEventResults.length && (
              <>
                <Table.Th style={{ textAlign: 'center' }}>
                  <SortableHeader
                    label="Finish Pos."
                    column="finishPosition"
                    activeColumn={sortColumn}
                    direction="asc"
                    onClick={onSortChange}
                  />
                </Table.Th>
                <Table.Th style={{ textAlign: 'center' }}>
                  <SortableHeader
                    label="Prime"
                    column="prime"
                    activeColumn={sortColumn}
                    direction="asc"
                    onClick={onSortChange}
                  />
                </Table.Th>
              </>
            )}
            <Table.Th w={50}/>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {standings.map((standing, index) => (
            <EventStandingRow
              key={`${standing.participantId}-${form.key(`standings.${index}`)}`}
              participantId={standing.participantId}
              index={index}
              raceEventResults={raceEventResults}
              raceEventPrimes={raceEventPrimes}
              isLast={index === standings.length - 1}
              onDelete={handleDeleteRow}
              onPointChange={onPointChange}
            />
          ))}
        </Table.Tbody>
      </Table>

      <Group mt="sm">
        <Button size="sm" variant="light" leftSection={<IconPlus/>} onClick={handleAddRow}>
          Add Row
        </Button>
      </Group>
    </>
  )
}
