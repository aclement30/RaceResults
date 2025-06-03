import { CloseButton, TextInput } from '@mantine/core'

type SearchFieldProps = {
  value: string | undefined
  onChange: (value: string) => void
}

export const SearchField: React.FC<SearchFieldProps> = ({ value, onChange }) => {
  return (
    <TextInput
      placeholder="Search participant name, team, bib number..."
      value={value}
      className="no-print"
      onChange={(event) => onChange(event.currentTarget.value)}
      rightSection={
        <CloseButton
          aria-label="Clear input"
          onClick={() => onChange('')}
          style={{ display: value ? undefined : 'none' }}
        />
      }
      style={{ flex: '1 1 auto' }}
    />
  )
}