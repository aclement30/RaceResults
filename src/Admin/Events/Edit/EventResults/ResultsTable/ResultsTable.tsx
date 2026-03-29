import { Anchor, Button, Center, Group, Stack, Table, Text, } from '@mantine/core'
import { IconListNumbers, IconPlus, IconUpload, } from '@tabler/icons-react'
import React, { useCallback, useContext } from 'react'
import type { CreateEventCategory, ParticipantResult } from '../../../../../../shared/types'
import { ResultRow } from '../ResultRow/ResultRow'
import { ResultsFormContext } from '../ResultsFormContext'
import { ColumnsPopover } from './ColumnsPopover'

export type ColumnKey =
  | 'bib'
  | 'team'
  | 'finishTime'
  | 'finishGap'
  | 'avgSpeed'
  | 'status'
  | 'uciId'
  | 'city'
  | 'province'
  | 'license'
  | 'age'
  | 'nationality'

type ColumnDef = {
  key: ColumnKey
  label: string
  hasData: (r: ParticipantResult) => boolean
}

export const OPTIONAL_COLUMNS: ColumnDef[] = [
  { key: 'bib', label: 'Bib', hasData: r => r.bibNumber != null },
  { key: 'uciId', label: 'UCI ID', hasData: r => !!r.uciId },
  { key: 'team', label: 'Team', hasData: r => !!r.team },
  { key: 'city', label: 'City', hasData: r => !!r.city },
  { key: 'province', label: 'Province', hasData: r => !!r.province },
  { key: 'license', label: 'License', hasData: r => !!r.license },
  { key: 'age', label: 'Age', hasData: r => r.age != null },
  { key: 'nationality', label: 'Nationality', hasData: r => !!r.nationality },
  { key: 'finishTime', label: 'Finish Time', hasData: r => !!r.finishTime },
  { key: 'finishGap', label: 'Finish Gap', hasData: r => r.finishGap != null },
  { key: 'avgSpeed', label: 'Avg Speed', hasData: r => r.avgSpeed != null },
  { key: 'status', label: 'Status', hasData: () => true },
]

export const DEMOGRAPHIC_COLUMNS: ColumnKey[] = ['city', 'province', 'license', 'age', 'nationality']

export const DEFAULT_COLUMNS = new Set<ColumnKey>(['bib', 'team', 'finishTime', 'status'])

export function detectColumns(results: ParticipantResult[]): Set<ColumnKey> {
  if (results.length === 0) return new Set(DEFAULT_COLUMNS)
  const detected = OPTIONAL_COLUMNS
  .filter(col => !DEMOGRAPHIC_COLUMNS.includes(col.key) && results.some(col.hasData))
  .map(col => col.key)
  return new Set([...DEFAULT_COLUMNS, ...detected])
}

type ResultsTableProps = {
  category: CreateEventCategory | undefined
  sourceUrls?: string[]
  visibleColumns: Set<ColumnKey>
  onToggleColumn: (key: ColumnKey) => void
  onAddCategory: () => void
  onUploadFile: () => void
}

export const ResultsTable: React.FC<ResultsTableProps> = ({
  category,
  sourceUrls,
  visibleColumns,
  onToggleColumn,
  onAddCategory,
  onUploadFile,
}) => {
  const formRef = useContext(ResultsFormContext)!
  const form = formRef.current

  const handleAddRow = useCallback(() => {
    const row: ParticipantResult = {
      participantId: `p-${Date.now()}`,
      position: formRef.current.getValues().results.length + 1,
      finishTime: null,
      status: 'FINISHER',
    }
    formRef.current.insertListItem('results', row)
  }, [])

  const handleDeleteRow = useCallback((participantId: string) => {
    const results = formRef.current.getValues().results
    const idx = results.findIndex(r => r.participantId === participantId)
    if (idx === -1) return
    formRef.current.removeListItem('results', idx)
  }, [])

  const handleMoveRow = useCallback((participantId: string, direction: 'up' | 'down') => {
    const results = formRef.current.getValues().results
    const from = results.findIndex(r => r.participantId === participantId)
    const to = direction === 'up' ? from - 1 : from + 1
    if (to < 0 || to >= results.length) return
    formRef.current.reorderListItem('results', { from, to })
  }, [])

  if (!category) {
    return (
      <Center style={{ height: '100%', minHeight: 300 }}>
        <Stack align="center" gap="sm">
          <div style={{
            backgroundColor: 'var(--mantine-color-gray-1)',
            borderRadius: '50%',
            width: 56,
            height: 56,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <IconListNumbers size={28} color="var(--mantine-color-gray-5)"/>
          </div>
          <Text size="sm" fw={500}>No categories yet</Text>
          <Stack gap={2} align="center">
            <Text size="sm" c="dimmed">Add a category to start entering results manually,</Text>
            <Text size="sm" c="dimmed">or upload a file to import results automatically.</Text>
          </Stack>
          <Group mt="xs">
            <Button
              size="sm"
              leftSection={<IconPlus size={14}/>}
              onClick={onAddCategory}
            >
              Add Category
            </Button>
            <Button
              size="sm"
              leftSection={<IconUpload size={14}/>}
              onClick={onUploadFile}
            >
              Upload File
            </Button>
          </Group>
        </Stack>
      </Center>
    )
  }

  // In uncontrolled mode, getValues() reads from internal refs synchronously.
  // This is safe in render because structural ops (insert/remove/reorder) trigger
  // a re-render, at which point getValues() returns the updated list.
  const results = form.getValues().results

  return (
    <>
      {results.length > 0 && (
        <Table striped highlightOnHover horizontalSpacing={4} verticalSpacing={4}>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Pos</Table.Th>
              {visibleColumns.has('bib') && <Table.Th>Bib</Table.Th>}
              <Table.Th>Athlete</Table.Th>
              {visibleColumns.has('uciId') && <Table.Th>UCI ID</Table.Th>}
              {visibleColumns.has('team') && <Table.Th>Team</Table.Th>}
              {visibleColumns.has('city') && <Table.Th>City</Table.Th>}
              {visibleColumns.has('province') && <Table.Th>Province</Table.Th>}
              {visibleColumns.has('license') && <Table.Th>License</Table.Th>}
              {visibleColumns.has('age') && <Table.Th>Age</Table.Th>}
              {visibleColumns.has('nationality') && <Table.Th>Nationality</Table.Th>}
              {visibleColumns.has('finishTime') && <Table.Th>Finish Time</Table.Th>}
              {visibleColumns.has('finishGap') && <Table.Th>Finish Gap</Table.Th>}
              {visibleColumns.has('avgSpeed') && <Table.Th>Avg Speed</Table.Th>}
              {visibleColumns.has('status') && <Table.Th>Status</Table.Th>}
              <Table.Th style={{ textAlign: 'right' }}>
                <ColumnsPopover visibleColumns={visibleColumns} onToggle={onToggleColumn}/>
              </Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {results.map((result, index) => (
              <ResultRow
                key={`${result.participantId}-${form.key(`results.${index}`)}`}
                participantId={result.participantId}
                index={index}
                isLast={index === results.length - 1}
                hasErrors={Object.keys(form.errors).some(k => k.startsWith(`results.${index}.`))}
                visibleColumns={visibleColumns}
                onDelete={handleDeleteRow}
                onMove={handleMoveRow}
              />
            ))}
          </Table.Tbody>
        </Table>
      )}

      <Group mt="sm">
        <Button
          size="sm"
          variant="light"
          leftSection={<IconPlus/>}
          onClick={handleAddRow}
        >
          Add Row
        </Button>
      </Group>

      {sourceUrls && sourceUrls.length > 0 && (
        <Stack gap={2} mt="md">
          <Text size="xs" c="dimmed" fw={500}>Source URLs</Text>
          {sourceUrls.map(url => (
            <Anchor key={url} href={url} target="_blank" size="xs">{url}</Anchor>
          ))}
        </Stack>
      )}
    </>
  )
}
