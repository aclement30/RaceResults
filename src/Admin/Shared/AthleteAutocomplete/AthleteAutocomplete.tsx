import { Autocomplete, type AutocompleteProps } from '@mantine/core'
import React, { useContext } from 'react'
import { AdminContext } from '../AdminContext'

type AthleteSelectProps = AutocompleteProps & {
  value: string
  onChange: (value: string) => void
  onOptionSubmit?: (value: string) => void
}

export const AthleteAutocomplete = React.memo<AthleteSelectProps>(({
  value,
  onChange,
  onOptionSubmit,
  ...restOfProps
}) => {
  const { athleteOptions } = useContext(AdminContext)

  return (
    <Autocomplete
      value={value}
      data={athleteOptions}
      onChange={onChange}
      onOptionSubmit={onOptionSubmit}
      placeholder="Name or search..."
      limit={10}
      {...restOfProps}
    />
  )
})