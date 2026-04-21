import { Autocomplete, type AutocompleteProps } from '@mantine/core'
import { IconUserCheck } from '@tabler/icons-react'
import React, { useCallback, useContext, useEffect, useState } from 'react'
import { AdminContext } from '../AdminContext'

type AthleteSelectProps = AutocompleteProps & {
  value: string
  uciId?: string
  onChange: (value: string) => void
  onOptionSubmit?: (value: string) => void
}

export const AthleteAutocomplete = React.memo<AthleteSelectProps>(({
  value,
  uciId,
  onChange,
  onOptionSubmit,
  ...restOfProps
}) => {
  const { athleteOptions, findAthlete } = useContext(AdminContext)
  const [isAthleteMatched, setIsAthleteMatched] = useState(false)

  let rightSection = restOfProps.rightSection

  if (!rightSection && isAthleteMatched) {
    rightSection = <IconUserCheck size={14} color="var(--mantine-color-green-6)"/>
  }

  const handleOptionSubmit = useCallback((uciId: string) => {
    setIsAthleteMatched(true)

    onOptionSubmit?.(uciId)
  }, [onOptionSubmit])

  useEffect(() => {
    const parts = value.trim().split(/\s+/)
    const firstName = parts[0] || ''
    const lastName = parts.slice(1).join(' ') || ''

    const matchingAthlete = findAthlete({
      uciId,
      firstName,
      lastName,
    })

    // Check if matching athlete's name matches the input value
    // Sometimes the UCI ID passed from props may not match the name in the input, so we want to ensure the name also matches before showing the checkmark
    const isNameMatching = `${matchingAthlete?.firstName} ${matchingAthlete?.lastName}`.toLowerCase().trim() === value.toLowerCase().trim()

    setIsAthleteMatched(isNameMatching)
  }, [value, uciId, athleteOptions])

  return (
    <Autocomplete
      value={value}
      data={athleteOptions}
      onChange={onChange}
      onOptionSubmit={handleOptionSubmit}
      placeholder="Name or search..."
      limit={10}
      {...restOfProps}
      rightSection={rightSection}
    />
  )
})