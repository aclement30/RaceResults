import { Autocomplete, type AutocompleteProps } from '@mantine/core'
import React, { useContext } from 'react'
import { AdminContext } from '../AdminContext'

type TeamAutocompleteProps = AutocompleteProps & {
  valueAttribute?: 'id' | 'name'
  value: string
  onChange: (value: string) => void
}

export const TeamAutocomplete = React.memo<TeamAutocompleteProps>(({
  value,
  valueAttribute = 'id',
  onChange,
  ...restOfProps
}) => {
  const { teamOptions } = useContext(AdminContext)

  return (
    <Autocomplete
      value={value}
      data={teamOptions[valueAttribute]}
      onChange={onChange}
      placeholder="Name or search..."
      limit={10}
      {...restOfProps}
    />
  )
})