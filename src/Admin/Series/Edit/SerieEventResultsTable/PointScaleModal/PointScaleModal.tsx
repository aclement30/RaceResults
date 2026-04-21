import { Box, Button, Group, ScrollArea, Select, Stack, Switch, Table, Text, TextInput } from '@mantine/core'
import { modals } from '@mantine/modals'
import React, { useState } from 'react'
import type { ParticipantResult, ParticipantSerieEventResult, PrimeResult } from '../../../../../../shared/types'

export type ScaleBaseColumn = 'finishPosition' | 'prime'
export type ScaleApplyMode = 'overwrite' | 'add'

const SCALE_STORAGE_KEYS: Record<ScaleBaseColumn, string> = {
  finishPosition: 'pointScale_finishPosition',
  prime: 'pointScale_prime',
}

const loadStoredScale = (column: ScaleBaseColumn): string =>
  localStorage.getItem(SCALE_STORAGE_KEYS[column]) ?? ''

const saveStoredScale = (column: ScaleBaseColumn, value: string) =>
  localStorage.setItem(SCALE_STORAGE_KEYS[column], value)

type PreviewRow = {
  position: number
  athleteName: string | null
  scalePoints: number
  existingPoints: number | null
  total: number | null
}

const parseScaleInput = (input: string): { scale: number[], error: string | null } => {
  if (!input.trim()) return { scale: [], error: null }

  const tokens = input.split(',').map(token => token.trim()).filter(token => token.length > 0)
  const scale: number[] = []

  for (const token of tokens) {
    const value = Number(token)
    if (!isFinite(value) || value < 0) {
      return { scale: [], error: `"${token}" is not a valid number` }
    }
    scale.push(value)
  }

  return { scale, error: null }
}

const findMatchingFormResult = (
  raceResult: ParticipantResult,
  formResults: ParticipantSerieEventResult[],
): ParticipantSerieEventResult | undefined => {
  if (raceResult.uciId) return formResults.find(r => r.uciId === raceResult.uciId)
  return formResults.find(r => r.firstName === raceResult.firstName && r.lastName === raceResult.lastName)
}

const buildPreviewRows = (
  parsedScale: number[],
  baseColumn: ScaleBaseColumn,
  mode: ScaleApplyMode,
  currentResults: ParticipantSerieEventResult[],
  raceEventResults: ParticipantResult[],
  raceEventPrimes: PrimeResult[],
): PreviewRow[] => parsedScale.map((scalePoints, index) => {
  const position = index + 1
  let athleteName: string | null = null
  let existingPoints: number | null = null

  if (baseColumn === 'finishPosition') {
    const raceResult = raceEventResults.find(r => r.position === position) ?? null
    if (raceResult) {
      athleteName = [raceResult.firstName, raceResult.lastName].filter(Boolean).join(' ') || null
      existingPoints = findMatchingFormResult(raceResult, currentResults)?.points ?? null
    }
  } else {
    const prime = raceEventPrimes.find(p => p.position === position) ?? null
    if (prime) {
      const raceResult = raceEventResults.find(r => r.participantId === prime.participantId) ?? null
      if (raceResult) {
        athleteName = [raceResult.firstName, raceResult.lastName].filter(Boolean).join(' ') || null
        existingPoints = findMatchingFormResult(raceResult, currentResults)?.points ?? null
      }
    }
  }

  const total = mode === 'add' && existingPoints !== null ? existingPoints + scalePoints : null

  return { position, athleteName, scalePoints, existingPoints, total }
})

type PointScaleModalProps = {
  currentResults: ParticipantSerieEventResult[]
  raceEventResults: ParticipantResult[]
  raceEventPrimes: PrimeResult[]
  onApply: (scalePoints: number[], baseColumn: ScaleBaseColumn, mode: ScaleApplyMode) => void
}

const PointScaleModal: React.FC<PointScaleModalProps> = ({
  currentResults,
  raceEventResults,
  raceEventPrimes,
  onApply,
}) => {
  const [baseColumn, setBaseColumn] = useState<ScaleBaseColumn>('finishPosition')
  const [mode, setMode] = useState<ScaleApplyMode>('overwrite')

  const initFromInput = (value: string) => {
    const { scale, error } = parseScaleInput(value)
    return {
      inputValue: value,
      parseError: error,
      parsedScale: error === null && scale.length > 0 ? scale : null,
    }
  }

  const [inputValue, setInputValue] = useState(() => loadStoredScale('finishPosition'))
  const [parseError, setParseError] = useState<string | null>(() => initFromInput(loadStoredScale('finishPosition')).parseError)
  const [parsedScale, setParsedScale] = useState<number[] | null>(() => initFromInput(loadStoredScale('finishPosition')).parsedScale)

  const handleInputChange = (value: string) => {
    setInputValue(value)
    saveStoredScale(baseColumn, value)
    const { scale, error } = parseScaleInput(value)
    setParseError(error)
    setParsedScale(error === null && scale.length > 0 ? scale : null)
  }

  const handleBaseColumnChange = (column: ScaleBaseColumn) => {
    setBaseColumn(column)
    const saved = loadStoredScale(column)
    const { scale, error } = parseScaleInput(saved)
    setInputValue(saved)
    setParseError(error)
    setParsedScale(error === null && scale.length > 0 ? scale : null)
  }

  const previewRows = parsedScale
    ? buildPreviewRows(parsedScale, baseColumn, mode, currentResults, raceEventResults, raceEventPrimes)
    : []

  const unmatchedCount = previewRows.filter(row => row.athleteName === null).length
  const showAddColumns = mode === 'add'

  return (
    <Stack gap="md">
      <Select
        label="Based on"
        value={baseColumn}
        onChange={value => handleBaseColumnChange(value as ScaleBaseColumn)}
        data={[
          { value: 'finishPosition', label: 'Finish Position' },
          ...(raceEventPrimes.length > 0 ? [{ value: 'prime', label: 'Prime' }] : []),
        ]}
      />

      <TextInput
        label="Points scale"
        description="Comma-separated values — position 1 first (e.g. 20, 17, 15, 13, 10)"
        placeholder="20, 17, 15, 13, 10, 8, 6, 4, 2, 1"
        value={inputValue}
        onChange={event => handleInputChange(event.currentTarget.value)}
        error={parseError}
      />

      <Switch
        label="Add to existing points"
        checked={mode === 'add'}
        onChange={event => setMode(event.currentTarget.checked ? 'add' : 'overwrite')}
      />

      {previewRows.length > 0 && (
        <Box>
          <Text size="xs" fw={500} c="dimmed" mb={6}>Preview</Text>
          <ScrollArea.Autosize mah={220}>
            <Table fz="xs" horizontalSpacing={6} verticalSpacing={2} withTableBorder withColumnBorders>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th w={40}>Pos</Table.Th>
                  <Table.Th>Athlete</Table.Th>
                  {showAddColumns ? (
                    <>
                      <Table.Th ta="right">Existing</Table.Th>
                      <Table.Th ta="right">+Scale</Table.Th>
                      <Table.Th ta="right">Total</Table.Th>
                    </>
                  ) : (
                    <Table.Th ta="right">Points</Table.Th>
                  )}
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {previewRows.map(row => (
                  <Table.Tr key={row.position}>
                    <Table.Td>{row.position}</Table.Td>
                    <Table.Td c={row.athleteName ? undefined : 'dimmed'}>
                      {row.athleteName ?? '—'}
                    </Table.Td>
                    {showAddColumns ? (
                      <>
                        <Table.Td ta="right" c="dimmed">{row.existingPoints ?? '—'}</Table.Td>
                        <Table.Td ta="right">+{row.scalePoints}</Table.Td>
                        <Table.Td ta="right" fw={500}>{row.total ?? '—'}</Table.Td>
                      </>
                    ) : (
                      <Table.Td ta="right" fw={500}>{row.scalePoints}</Table.Td>
                    )}
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </ScrollArea.Autosize>
          {unmatchedCount > 0 && (
            <Text size="xs" c="dimmed" mt={4}>
              {unmatchedCount} position{unmatchedCount !== 1 ? 's' : ''} have no matching athlete in the current results
            </Text>
          )}
        </Box>
      )}

      <Group justify="flex-end" mt="xs">
        <Button variant="default" onClick={() => modals.closeAll()}>Cancel</Button>
        <Button
          disabled={!parsedScale}
          onClick={() => {
            onApply(parsedScale!, baseColumn, mode)
            modals.closeAll()
          }}
        >
          Apply
        </Button>
      </Group>
    </Stack>
  )
}

export const openPointScaleModal = ({
  currentResults,
  raceEventResults,
  raceEventPrimes,
  onApply,
}: {
  currentResults: ParticipantSerieEventResult[]
  raceEventResults: ParticipantResult[]
  raceEventPrimes: PrimeResult[]
  onApply: (scalePoints: number[], baseColumn: ScaleBaseColumn, mode: ScaleApplyMode) => void
}) => {
  modals.open({
    title: 'Apply Points Scale',
    size: 'md',
    children: (
      <PointScaleModal
        currentResults={currentResults}
        raceEventResults={raceEventResults}
        raceEventPrimes={raceEventPrimes}
        onApply={onApply}
      />
    ),
  })
}
