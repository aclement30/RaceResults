import { Stack, Text } from '@mantine/core'
import { IconDatabaseOff } from '@tabler/icons-react'
import React from 'react'

type EmptyStateProps = {
  icon?: React.ReactNode
  text?: React.ReactNode
  button?: React.ReactNode
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, text, button }) => {
  return (<div style={{
    flexDirection: 'column',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    margin: '0 auto',
  }}>
    <Stack align="center" gap="sm">
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#e9ecef',
        borderRadius: '50%',
        width: 50,
        height: 50,
        color: 'grey',
        marginBottom: '0.5rem',
      }}>
        {icon || (<IconDatabaseOff/>)}
      </div>

      {typeof text === 'string' ? (
        <Text c="dimmed" size="sm">{text || 'No records'}</Text>
      ) : (
        text
      )}

      {button}
    </Stack>
  </div>)
}