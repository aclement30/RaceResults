import { Tooltip } from '@mantine/core'
import { IconAlertCircle } from '@tabler/icons-react'
import React from 'react'

export const InputErrorIcon: React.FC<{ error?: React.ReactNode }> = ({ error }) => {
  if (!error) return undefined

  return (
    <Tooltip label={error} withArrow>
      <IconAlertCircle size={14} color="var(--mantine-color-red-6)" style={{ cursor: 'default' }}/>
    </Tooltip>
  )
}