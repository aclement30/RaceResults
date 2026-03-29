import { Switch } from '@mantine/core'
import React, { useEffect, useState } from 'react'

type UserLockSwitchProps = {
  initialValue?: boolean
  onChange: (locked: boolean) => Promise<boolean>
}

export const UserLockSwitch: React.FC<UserLockSwitchProps> = ({ initialValue = false, onChange }) => {
  const [isLocked, setIsLocked] = useState(initialValue)

  // Sync local state with prop changes
  useEffect(() => {
    setIsLocked(initialValue)
  }, [initialValue])

  return (<Switch
      display="inline-flex"
      checked={isLocked}
      size="md"
      color="red"
      onLabel="ON"
      offLabel="OFF"
      styles={{ trackLabel: { fontSize: '12px', padding: '0 10px' } }}
      onChange={async () => {
        setIsLocked(!initialValue)

        const result = await onChange(!initialValue)

        if (!result) {
          setIsLocked(initialValue) // Revert if onChange returns false
        }
      }}
    />
  )
}