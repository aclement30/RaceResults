import { Autocomplete, type AutocompleteProps, type OptionsFilter } from '@mantine/core'
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
  const { athletes, athleteOptions, findAthlete } = useContext(AdminContext)
  const [isAthleteMatched, setIsAthleteMatched] = useState(false)

  const filter = useCallback<OptionsFilter>(({ options, search }) => {
    const searchLower = search.toLowerCase().trim()
    if (!searchLower) return options

    return options.filter((option) => {
      const comboboxOption = option as { value: string; label: string }
      if (comboboxOption.label.toLowerCase().includes(searchLower)) return true

      const athlete = athletes.get(comboboxOption.value)
      return (athlete?.alternateNames || []).some(name => name.toLowerCase().includes(searchLower))
    })
  }, [athletes])

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
    const valueLower = value.toLowerCase().trim()
    const isPrimaryNameMatching = `${matchingAthlete?.firstName} ${matchingAthlete?.lastName}`.toLowerCase().trim() === valueLower
    const isAlternateNameMatching = (matchingAthlete?.alternateNames || []).some(name => name.toLowerCase().trim() === valueLower)
    const isNameMatching = isPrimaryNameMatching || isAlternateNameMatching

    setIsAthleteMatched(isNameMatching)
  }, [value, uciId, athleteOptions])

  return (
    <Autocomplete
      value={value}
      data={athleteOptions}
      filter={filter}
      onChange={onChange}
      onOptionSubmit={handleOptionSubmit}
      placeholder="Name or search..."
      limit={10}
      {...restOfProps}
      rightSection={rightSection}
    />
  )
})