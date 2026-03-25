import { Button, Group, Stack, Text, TextInput } from '@mantine/core'
import { modals } from '@mantine/modals'
import React, { useState } from 'react'
import type { RaceEvent } from '../../../../../shared/types'
import { showErrorMessage } from '../../../../utils/showErrorMessage'
import { showSuccessMessage } from '../../../../utils/showSuccessMessage'
import { adminApi } from '../../../utils/api'

const MODAL_ID = 'delete-event-modal'

type DeleteEventModalProps = {
  event: RaceEvent
  onDeleted: () => void
}

const DeleteEventModal: React.FC<DeleteEventModalProps> = ({ event, onDeleted }) => {
  const [confirmName, setConfirmName] = useState('')
  const [loading, setLoading] = useState(false)

  const year = +event.date.slice(0, 4)
  const isConfirmed = confirmName === event.name

  const handleDelete = async () => {
    try {
      setLoading(true)
      await adminApi.delete.event(year, event.hash)

      showSuccessMessage({ title: 'Event deleted', message: `${event.name} has been deleted.` })

      modals.close(MODAL_ID)
      onDeleted()
    } catch (error) {
      showErrorMessage({ title: 'Delete failed', message: (error as any).message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Stack gap="md">
      <Group gap="xs" align="flex-start">
        <Text size="sm">
          This will permanently delete <strong>{event.name}</strong> event and all its results. This action cannot be
          undone.
        </Text>
      </Group>

      <TextInput
        label={<Text size="sm">Type <strong>{event.name}</strong> to confirm:</Text>}
        placeholder={event.name}
        value={confirmName}
        onChange={(e) => setConfirmName(e.currentTarget.value)}
      />

      <Group justify="flex-end">
        <Button variant="default" onClick={() => modals.close(MODAL_ID)}>Cancel</Button>
        <Button color="red" disabled={!isConfirmed} loading={loading} onClick={handleDelete}>
          Delete Event
        </Button>
      </Group>
    </Stack>
  )
}

export const openDeleteEventModal = (props: DeleteEventModalProps) => {
  modals.open({
    modalId: MODAL_ID,
    title: 'Delete Event',
    children: <DeleteEventModal {...props} />,
  })
}
