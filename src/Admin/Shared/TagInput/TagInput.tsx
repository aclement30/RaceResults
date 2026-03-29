import React, { useState } from 'react'
import { Pill, PillsInput } from '@mantine/core'

type TagInputProps = {
  label: string
  placeholder?: string
  value: string[]
  onChange: (newTags: string[]) => void
  styles?: {
    input?: React.CSSProperties
  }
}

export const TagInput: React.FC<TagInputProps> = ({ label, placeholder, value, onChange, styles }) => {
  const [search, setSearch] = useState<string>('')

  const handleChange = (event: any) => {
    setSearch(event.currentTarget.value)
  }

  const handleKeyDown = (event: any) => {
    // Remove the last tag value when Backspace is pressed and the search input is empty
    if (event.key === 'Backspace' && search.length === 0 && value.length > 0) {
      event.preventDefault()
      const updatedValues = value.slice(0, -1)
      onChange(updatedValues)
    } else if ((event.key === 'Enter' || event.key === ',') && search.trim() !== '') {
      event.preventDefault()
      if (!value.includes(search.trim())) {
        onChange([...value, search.trim()])
      }
      setSearch('')
    }
  }

  const removePillValue = (item: string) => {
    const updatedValues = value.filter((v) => v !== item)
    onChange(updatedValues)
  }

  return (
    <PillsInput label={label} styles={styles}>
      <Pill.Group>
        {value?.map((tag => (
          <Pill key={tag}
                withRemoveButton
                onRemove={() => removePillValue(tag)}>
            {tag}
          </Pill>
        )))}

        <PillsInput.Field
          placeholder={placeholder}
          value={search}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
        />
      </Pill.Group>
    </PillsInput>
  )
}