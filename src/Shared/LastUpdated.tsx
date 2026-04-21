import { Group, Text } from '@mantine/core'
import React from 'react'

type LastUpdatedProps = {
  date: Date | null
}

export const LastUpdated: React.FC<LastUpdatedProps> = ({ date }) => {
  if (!date) return null

  return (
    <Group justify="space-between">
      <Text c="dimmed" size="sm" style={{ padding: '1rem 0' }}>Last
        Updated: {date.toLocaleDateString('en-CA', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        })}</Text>

      {/*<FeedbackWidget/>*/}
    </Group>
  )
}