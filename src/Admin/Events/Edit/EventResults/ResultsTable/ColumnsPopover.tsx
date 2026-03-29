import { ActionIcon, Checkbox, Popover, Stack, Tooltip } from '@mantine/core'
import { IconSettings } from '@tabler/icons-react'
import React, { useState } from 'react'
import type { ColumnKey } from './ResultsTable'
import { OPTIONAL_COLUMNS } from './ResultsTable'

type ColumnsPopoverProps = {
  visibleColumns: Set<ColumnKey>
  onToggle: (key: ColumnKey) => void
}

export const ColumnsPopover: React.FC<ColumnsPopoverProps> = ({ visibleColumns, onToggle }) => {
  const [open, setOpen] = useState(false)

  return (
    <Popover opened={open} onChange={setOpen} position="bottom-end" withArrow>
      <Popover.Target>
        <Tooltip label="Select visible columns" withArrow position="left">
          <ActionIcon size="sm" variant="subtle" color="gray" onClick={() => setOpen(o => !o)}>
            <IconSettings/>
          </ActionIcon>
        </Tooltip>
      </Popover.Target>
      <Popover.Dropdown>
        <Stack gap="xs">
          {OPTIONAL_COLUMNS.map(col => (
            <Checkbox
              key={col.key}
              label={col.label}
              checked={visibleColumns.has(col.key)}
              onChange={() => onToggle(col.key)}
              size="sm"
            />
          ))}
        </Stack>
      </Popover.Dropdown>
    </Popover>
  )
}
