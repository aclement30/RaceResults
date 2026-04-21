import { UnstyledButton } from '@mantine/core'
import { IconCaretDown, IconCaretDownFilled } from '@tabler/icons-react'
import React from 'react'
import type { SortColumn } from '../../EventIndividualStandings/EventIndividualStandings'

type SortableHeaderProps = {
  label: string
  column: SortColumn
  activeColumn: SortColumn
  direction: 'asc' | 'desc'
  onClick: (column: SortColumn) => void
}

export const SortableHeader: React.FC<SortableHeaderProps> = ({ label, column, activeColumn, direction, onClick }) => {
  const isActive = column === activeColumn
  const Icon = isActive ? IconCaretDownFilled : IconCaretDown
  const rotation = direction === 'asc' ? 'rotate(180deg)' : undefined

  return (
    <UnstyledButton
      onClick={() => onClick(column)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        fontSize: 'inherit',
      }}
    >
      {label}
      <Icon
        color={isActive ? 'var(--mantine-color-blue-6)' : 'var(--mantine-color-gray-4)'}
        style={{ transform: rotation, flexShrink: 0 }}
      />
    </UnstyledButton>
  )
}