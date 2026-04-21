import { Button, Group, Stack, Text, TextInput } from '@mantine/core'
import { modals } from '@mantine/modals'
import React, { useState } from 'react'
import { showErrorMessage } from '../../../../../utils/showErrorMessage'
import { adminApi } from '../../../../utils/api'

const MODAL_ID = 'delete-serie-event-modal'

type DeleteSerieEventModalProps = {
  year: number
  serieHash: string
  date: string
  formattedDate: string
  onDeleted: () => void
}

const DeleteSerieEventModal: React.FC<DeleteSerieEventModalProps> = ({
  year,
  serieHash,
  date,
  formattedDate,
  onDeleted,
}) => {
  const [confirmValue, setConfirmValue] = useState('')
  const [loading, setLoading] = useState(false)

  const isConfirmed = confirmValue === 'delete'

  const handleDelete = async () => {
    try {
      setLoading(true)
      await adminApi.delete.serieStandingEvent(year, serieHash, date)
      modals.close(MODAL_ID)
      onDeleted()
    } catch (err) {
      showErrorMessage({ title: 'Delete Error', message: (err as Error).message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Stack gap="md">
      <Text size="sm">
        This will permanently delete all categories standings for <br/><strong>{formattedDate}</strong>. This action
        cannot
        be undone.
      </Text>

      <TextInput
        label={<Text size="sm">Type <strong>delete</strong> to confirm:</Text>}
        placeholder="delete"
        value={confirmValue}
        onChange={e => setConfirmValue(e.currentTarget.value)}
      />

      <Group justify="flex-end">
        <Button variant="default" onClick={() => modals.close(MODAL_ID)}>Cancel</Button>
        <Button color="red" disabled={!isConfirmed} loading={loading} onClick={handleDelete}>
          Delete
        </Button>
      </Group>
    </Stack>
  )
}

export const openDeleteSerieEventModal = (props: Omit<DeleteSerieEventModalProps, never>) => {
  modals.open({
    modalId: MODAL_ID,
    title: 'Delete Event Standings',
    children: <DeleteSerieEventModal {...props} />,
  })
}
