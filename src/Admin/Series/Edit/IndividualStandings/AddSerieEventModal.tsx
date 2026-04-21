import { Button, Group, Select, Stack } from '@mantine/core'
import { DatePickerInput } from '@mantine/dates'
import { modals } from '@mantine/modals'
import React, { useMemo, useState } from 'react'
import type { BaseSerieEvent, RaceEvent, Serie } from '../../../../../shared/types'
import { showErrorMessage } from '../../../../utils/showErrorMessage'
import { adminApi } from '../../../utils/api'

const MODAL_ID = 'add-serie-event-modal'

type AddSerieEventModalProps = {
  serie: Serie
  raceEvents: RaceEvent[]
  serieEvents: BaseSerieEvent[]
  onCreate: (date: string) => void
}

const AddSerieEventModal: React.FC<AddSerieEventModalProps> = ({ serie, raceEvents, serieEvents, onCreate }) => {
  const [selectedRaceHash, setSelectedRaceHash] = useState<string | null>(null)
  const [date, setDate] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const existingDates = useMemo(() => new Set(serieEvents.map(e => e.date)), [serieEvents])

  const organizerRaces = useMemo(() =>
    raceEvents
      .filter(e => e.organizerAlias === serie.organizerAlias)
      .sort((a, b) => b.date.localeCompare(a.date)),
    [raceEvents, serie.organizerAlias]
  )

  const hasRaceEvents = organizerRaces.length > 0

  const raceOptions = organizerRaces.map(e => ({
    value: e.hash,
    label: `${e.name} — ${e.date}`,
    disabled: existingDates.has(e.date),
  }))

  const effectiveDate = hasRaceEvents
    ? (organizerRaces.find(e => e.hash === selectedRaceHash)?.date ?? null)
    : date

  const handleSubmit = async () => {
    if (!effectiveDate) return

    try {
      setLoading(true)
      await adminApi.create.serieStandingEvent(serie.year, serie.hash, effectiveDate)
      modals.close(MODAL_ID)
      onCreate(effectiveDate)
    } catch (error) {
      showErrorMessage({ title: 'Error', message: (error as any).message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Stack gap="md">
      {hasRaceEvents ? (
        <Select
          label="Race"
          placeholder="Select a race"
          required
          data={raceOptions}
          value={selectedRaceHash}
          onChange={setSelectedRaceHash}
          searchable
        />
      ) : (
        <DatePickerInput
          label="Race Date"
          placeholder="Select a date"
          required
          value={date}
          onChange={setDate}
          maxDate={new Date()}
        />
      )}

      <Group justify="flex-end">
        <Button variant="default" onClick={() => modals.close(MODAL_ID)}>Cancel</Button>
        <Button disabled={!effectiveDate} loading={loading} onClick={handleSubmit}>
          Continue
        </Button>
      </Group>
    </Stack>
  )
}

export const openAddSerieEventModal = (props: AddSerieEventModalProps) => {
  modals.open({
    modalId: MODAL_ID,
    title: 'Add Race Standings',
    children: <AddSerieEventModal {...props}/>,
  })
}
