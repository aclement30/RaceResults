import * as React from 'react'
import {
  Autocomplete,
  type AutocompleteProps,
  type ComboboxItem, Group, Highlight, type OptionsFilter,
  Stack,
  type Styles, Text,
  useMatches
} from '@mantine/core'
import { IconSearch, IconStarFilled, IconUserOff } from '@tabler/icons-react'
import { useCallback, useContext, useMemo, useState } from 'react'
import { AppContext } from '../AppContext'
import { EmptyState } from './EmptyState'
import { useFocusTrap } from '@mantine/hooks'

type AthleteSearchFieldProps = {
  onSelect(athleteUciId: string): void
  autoFocus?: boolean
  dropdownTop?: string
}

const currentYear = new Date().getFullYear()

export const AthleteSearchField: React.FC<AthleteSearchFieldProps> = ({
  onSelect,
  autoFocus = false,
  dropdownTop = 'var(--app-shell-header-height)'
}) => {
  const { athletes, favoriteAthletes } = useContext(AppContext)
  const [searchValue, setSearchValue] = useState('')
  const focusTrapRef = useFocusTrap()

  const athleteOptions = useMemo(() => {
    const options: ComboboxItem[] = []

    athletes.forEach((athlete) => {
      options.push({
        value: athlete.uciId,
        label: `${athlete.firstName} ${athlete.lastName}`,
      })
    })

    return options
  }, [athletes])

  const athleteOptionsFilter: OptionsFilter = useCallback(({ options, search }) => {
    if (!search?.length) return []

    const searchValueLower = search.toLowerCase().trim()

    let filteredOptions = options.filter((option) => {
      const athlete = athletes.get((option as ComboboxItem).value)

      if (!athlete) return false

      const { firstName, lastName, uciId } = athlete
      const fullName = `${firstName} ${lastName}`.toLowerCase()

      if (!isNaN(+searchValueLower) && searchValueLower.length === 11) {
        return uciId === searchValueLower
      } else {
        return fullName.includes(searchValueLower)
      }
    })

    filteredOptions = filteredOptions.sort((a, b) => {
      if (favoriteAthletes.includes((a as ComboboxItem).value)) return -1
      if (favoriteAthletes.includes((b as ComboboxItem).value)) return 1
      return (a as ComboboxItem).label.localeCompare((b as ComboboxItem).label)
    })

    return filteredOptions
  }, [athletes, favoriteAthletes])

  const autocompleteProps = useMatches({
    base: {
      styles: {
        root: {
          flex: '1 1 auto',
        },
        dropdown: {
          overflowY: 'auto',
          height: `calc(100% - ${dropdownTop})`,
          top: dropdownTop,
          border: 'none',
          left: 0,
          borderRadius: 0,
          position: 'fixed',
        },
        option: {
          borderBottom: '1px solid var(--mantine-color-gray-3)',
          borderRadius: 0,
        },
      } as Styles<any>,
      comboboxProps: {
        width: '100%',
        dropdownPadding: 0,
      },
      withScrollArea: false,
      emptyState: true,
    },
    sm: {
      styles: {
        root: {
          flex: '1 1 auto',
        },
      },
      comboboxProps: {},
      withScrollArea: true,
      maxDropdownHeight: 400,
      emptyState: false,
    },
  })

  const renderAutocompleteOption: AutocompleteProps['renderOption'] = ({ option }) => {
    const athlete = athletes.get(option.value)

    if (!athlete) return null

    const team = athlete.team?.[currentYear] || null

    return (
      <Stack
        key={athlete.uciId}
        align="stretch"
        gap="0"
        style={{ width: '100%', overflowX: 'hidden' }}
      >
        <Group justify="space-between" align="center">
          <Highlight highlight={searchValue}>{`${athlete.firstName} ${athlete.lastName}`}</Highlight>

          {favoriteAthletes.includes(athlete.uciId) && <IconStarFilled size={12} color="grey"/>}
        </Group>
        <Text c="dimmed" size="sm" style={{
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          textOverflow: 'ellipsis'
        }}>{team?.name || 'Independent'}</Text>
      </Stack>
    )
  }

  const handleAthleteSelect = (value: string) => {
    onSelect(value)
    setTimeout(() => setSearchValue(''), 0)
  }

  return (
    <div ref={autoFocus && focusTrapRef || undefined} style={{ flex: '1 1 auto' }}>
      <Autocomplete
        placeholder="Search athlete..."
        data={athleteOptions}
        leftSection={<IconSearch height="50%"/>}
        filter={athleteOptionsFilter}
        clearable={true}
        renderOption={renderAutocompleteOption}
        withScrollArea={autocompleteProps.withScrollArea}
        styles={autocompleteProps.styles}
        comboboxProps={autocompleteProps.comboboxProps}
        maxDropdownHeight={autocompleteProps.maxDropdownHeight}
        onOptionSubmit={handleAthleteSelect}
        value={searchValue}
        onChange={setSearchValue}
      />
      <div style={{
        width: '100%',
        height: `calc(100% - ${dropdownTop})`,
        backgroundColor: 'white',
        top: dropdownTop,
        border: 'none',
        left: 0,
        borderRadius: 0,
        position: 'fixed',
        display: autocompleteProps.emptyState && searchValue?.length ? 'flex' : 'none',
        alignItems: 'center'
      }}>
        <EmptyState icon={<IconUserOff/>}>No athlete found</EmptyState>
      </div>
    </div>
  )
}