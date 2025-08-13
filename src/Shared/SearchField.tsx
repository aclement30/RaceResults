import * as React from 'react'
import { CloseButton, TextInput } from '@mantine/core'
import { IconSearch } from '@tabler/icons-react'

type SearchFieldProps = {
  value: string | undefined
  onChange: (value: string) => void
  placeholder?: string
  style?: React.CSSProperties
}

export const SearchField: React.FC<SearchFieldProps> = ({
  value,
  onChange,
  placeholder = 'Search participant name, team, bib number...',
  style = {}
}) => {
  return (
    <TextInput
      placeholder={placeholder}
      value={value}
      className="no-print"
      onChange={(event) => onChange(event.currentTarget.value)}
      leftSection={<IconSearch height="50%"/>}
      rightSection={
        <CloseButton
          aria-label="Clear input"
          onClick={() => onChange('')}
          style={{ display: value ? undefined : 'none' }}
        />
      }
      style={{ flex: '1 1 auto', ...style }}
    />
  )
}