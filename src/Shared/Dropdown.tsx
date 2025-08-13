import * as React from 'react'
import { Button, type ButtonProps, Menu } from '@mantine/core'
import { IconChevronDown, IconChevronUp } from '@tabler/icons-react'
import { useDisclosure } from '@mantine/hooks'

export type DropdownItem<T extends string | number> = {
  label: string
  value: T
  icon?: React.ReactNode
  disabled?: boolean
}

type DropdownProps<T extends string | number> = {
  items: DropdownItem<T>[]
  size?: ButtonProps['size']
  onSelect: (value: T) => void
  value?: T
}

export const Dropdown = <T extends string | number, >({ items, size = 'xs', onSelect, value }: DropdownProps<T>) => {
  const targetLabel = items.find(item => item.value === value)?.label || items[0].label
  const [opened, { toggle }] = useDisclosure(false)

  return (
    <Menu opened={opened} onChange={toggle}>
      <Menu.Target>
        <Button size={size} variant="outline"
                rightSection={opened ? <IconChevronUp/> : <IconChevronDown/>}>{targetLabel}</Button>
      </Menu.Target>

      <Menu.Dropdown>
        {items.map(item => (
          <Menu.Item
            key={item.value}
            onClick={() => onSelect(item.value)}
            leftSection={item.icon}
            disabled={item.disabled}
          >
            {item.label}
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  )
}