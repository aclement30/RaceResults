import { Select, type SelectProps } from '@mantine/core'
import React from 'react'

export const MappingSelect: React.FC<SelectProps> = (props) => (
  <Select
    size="xs"
    allowDeselect={false}
    {...props}
    styles={props.value === '__none__' ? { input: { color: 'var(--mantine-color-dimmed)' } } : undefined}
  />
)