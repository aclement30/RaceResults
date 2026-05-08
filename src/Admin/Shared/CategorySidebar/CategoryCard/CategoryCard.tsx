import { ActionIcon, Box, Group, Paper, Stack, Text } from '@mantine/core'
import { IconChevronDown, IconChevronUp, IconPencil, IconTrash } from '@tabler/icons-react'
import React from 'react'
import type { BaseCategory } from '../../../../../shared/types'

type CategoryCardProps = {
  category: BaseCategory
  isActive: boolean
  isDirty: boolean
  hasPendingUpdate?: boolean
  indent?: boolean
  canMoveUp: boolean
  canMoveDown: boolean
  onSelect: (alias: string) => void
  onEdit: (alias: string) => void
  onDelete: (alias: string) => void
  onMoveUp: () => void
  onMoveDown: () => void
}

export const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  isActive,
  isDirty,
  hasPendingUpdate,
  indent,
  canMoveUp,
  canMoveDown,
  onSelect,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
}) => (
  <Paper
    p="sm"
    withBorder
    ml={indent ? 'md' : undefined}
    style={{
      cursor: 'pointer',
      backgroundColor: isActive ? 'var(--mantine-color-blue-light)' : undefined,
    }}
    onClick={() => onSelect(category.alias)}
  >
    <Group justify="space-between" wrap="nowrap">
      <div>
        <Group gap={4} wrap="nowrap">
          <Text size="sm" fw={500}>{category.label}</Text>
          {isDirty
            ? <Box w={8} h={8} style={{ borderRadius: '50%', backgroundColor: '#fece02', flexShrink: 0 }}/>
            : hasPendingUpdate
              ? <Box w={8} h={8} style={{ borderRadius: '50%', backgroundColor: 'var(--mantine-color-blue-6)', flexShrink: 0 }}/>
              : null
          }
        </Group>
        <Text size="xs" c="dimmed">
          {category.gender === 'M' ? 'Men' : category.gender === 'F' ? 'Women' : 'Mixed'}
        </Text>
      </div>

      <Group gap={4} wrap="nowrap">
        {isActive && (
          <>
            <ActionIcon
              size="sm"
              variant="subtle"
              onClick={e => {
                e.stopPropagation()
                onEdit(category.alias)
              }}
            >
              <IconPencil size={16}/>
            </ActionIcon>
            <ActionIcon
              size="sm"
              variant="subtle"
              color="red"
              onClick={e => {
                e.stopPropagation()
                onDelete(category.alias)
              }}
            >
              <IconTrash size={16}/>
            </ActionIcon>
          </>
        )}

        <Stack gap={0}>
          <ActionIcon
            size="xs"
            variant="subtle"
            disabled={!canMoveUp}
            onClick={e => {
              e.stopPropagation()
              onMoveUp()
            }}
          >
            <IconChevronUp size={12}/>
          </ActionIcon>
          <ActionIcon
            size="xs"
            variant="subtle"
            disabled={!canMoveDown}
            onClick={e => {
              e.stopPropagation()
              onMoveDown()
            }}
          >
            <IconChevronDown size={12}/>
          </ActionIcon>
        </Stack>
      </Group>
    </Group>
  </Paper>
)
