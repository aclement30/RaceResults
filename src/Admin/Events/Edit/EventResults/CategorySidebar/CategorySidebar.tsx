import { ActionIcon, Box, Button, Group, Indicator, Paper, Stack, Text } from '@mantine/core'
import { IconChevronDown, IconChevronUp, IconLock, IconPencil, IconPlus, IconTrash } from '@tabler/icons-react'
import React from 'react'
import type { CreateEventCategory } from '../../../../../../shared/types/events'

type CategorySidebarProps = {
  categories: CreateEventCategory[]
  activeCategory: string | null
  dirtyCategories?: Set<string>
  onSelectCategory: (alias: string) => void
  onEditCategory: (alias: string) => void
  onDeleteCategory: (alias: string) => void
  onReorderCategories: (categories: CreateEventCategory[]) => void
  onAddCategory: () => void
}

const CategoryCard: React.FC<{
  cat: CreateEventCategory
  activeCategory: string | null
  dirtyCategories?: Set<string>
  indent?: boolean
  canMoveUp: boolean
  canMoveDown: boolean
  onSelectCategory: (alias: string) => void
  onEditCategory: (alias: string) => void
  onDeleteCategory: (alias: string) => void
  onMoveUp: () => void
  onMoveDown: () => void
}> = ({
  cat,
  activeCategory,
  dirtyCategories,
  indent,
  canMoveUp,
  canMoveDown,
  onSelectCategory,
  onEditCategory,
  onDeleteCategory,
  onMoveUp,
  onMoveDown
}) => (
  <Paper
    p="sm"
    withBorder
    ml={indent ? 'md' : undefined}
    style={{
      cursor: 'pointer',
      backgroundColor: activeCategory === cat.alias ? 'var(--mantine-color-blue-light)' : undefined,
    }}
    onClick={() => onSelectCategory(cat.alias)}
  >
    <Group justify="space-between" wrap="nowrap">
      <div>
        <Indicator
          disabled={!dirtyCategories?.has(cat.alias)}
          size={8}
          color="#fece02"
          position="middle-end"
          offset={-4}
        >
          <Group gap={4} wrap="nowrap" pr={8}>
            <Text size="sm" fw={500}>
              {cat.label}
            </Text>
            {cat.userLocked && <IconLock size={12} color="var(--mantine-color-gray-5)"/>}
          </Group>
        </Indicator>
        <Text size="xs" c="dimmed">
          {cat.results.length} results ·{' '}
          {cat.gender === 'M' ? 'Men' : cat.gender === 'F' ? 'Women' : 'Mixed'}
        </Text>
      </div>

      <Group gap={4} wrap="nowrap">
        {cat.alias === activeCategory && (
          <>
            <ActionIcon
              size="sm"
              variant="subtle"
              onClick={e => {
                e.stopPropagation()
                onEditCategory(cat.alias)
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
                onDeleteCategory(cat.alias)
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

export const CategorySidebar: React.FC<CategorySidebarProps> = ({
  categories,
  activeCategory,
  dirtyCategories,
  onSelectCategory,
  onEditCategory,
  onDeleteCategory,
  onReorderCategories,
  onAddCategory,
}) => {
  const topLevel = categories.filter(c => !c.parentCategory)
  const subCategoryMap = new Map<string, CreateEventCategory[]>()
  categories.forEach(c => {
    if (c.parentCategory) {
      const list = subCategoryMap.get(c.parentCategory) ?? []
      list.push(c)
      subCategoryMap.set(c.parentCategory, list)
    }
  })

  const buildFlatArray = (newTopLevel: CreateEventCategory[], newSubMap: Map<string, CreateEventCategory[]>) =>
    newTopLevel.flatMap(c => [c, ...(newSubMap.get(c.alias) ?? [])])

  const handleMoveTopLevel = (alias: string, direction: 'up' | 'down') => {
    const idx = topLevel.findIndex(c => c.alias === alias)
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= topLevel.length) return
    const newTopLevel = [...topLevel]
    ;[newTopLevel[idx], newTopLevel[swapIdx]] = [newTopLevel[swapIdx], newTopLevel[idx]]
    onReorderCategories(buildFlatArray(newTopLevel, subCategoryMap))
  }

  const handleMoveSub = (alias: string, parentAlias: string, direction: 'up' | 'down') => {
    const siblings = subCategoryMap.get(parentAlias) ?? []
    const idx = siblings.findIndex(c => c.alias === alias)
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= siblings.length) return
    const newSiblings = [...siblings]
    ;[newSiblings[idx], newSiblings[swapIdx]] = [newSiblings[swapIdx], newSiblings[idx]]
    const newSubMap = new Map(subCategoryMap)
    newSubMap.set(parentAlias, newSiblings)
    onReorderCategories(buildFlatArray(topLevel, newSubMap))
  }

  return (
    <Box style={{ width: 280, flexShrink: 0 }}>
      <Text size="sm" fw={500} mb="xs" c="dimmed">
        Categories
      </Text>
      {categories.length === 0 && (
        <Text size="xs" c="dimmed" mb="xs">No categories yet</Text>
      )}
      <Stack gap="xs">
        {topLevel.map((cat, idx) => (
          <React.Fragment key={cat.alias}>
            <CategoryCard
              cat={cat}
              activeCategory={activeCategory}
              dirtyCategories={dirtyCategories}
              canMoveUp={idx > 0}
              canMoveDown={idx < topLevel.length - 1}
              onSelectCategory={onSelectCategory}
              onEditCategory={onEditCategory}
              onDeleteCategory={onDeleteCategory}
              onMoveUp={() => handleMoveTopLevel(cat.alias, 'up')}
              onMoveDown={() => handleMoveTopLevel(cat.alias, 'down')}
            />
            {(subCategoryMap.get(cat.alias) ?? []).map((sub, subIdx, siblings) => (
              <CategoryCard
                key={sub.alias}
                cat={sub}
                activeCategory={activeCategory}
                dirtyCategories={dirtyCategories}
                indent
                canMoveUp={subIdx > 0}
                canMoveDown={subIdx < siblings.length - 1}
                onSelectCategory={onSelectCategory}
                onEditCategory={onEditCategory}
                onDeleteCategory={onDeleteCategory}
                onMoveUp={() => handleMoveSub(sub.alias, cat.alias, 'up')}
                onMoveDown={() => handleMoveSub(sub.alias, cat.alias, 'down')}
              />
            ))}
          </React.Fragment>
        ))}
      </Stack>

      <Button
        mt="sm"
        size="xs"
        variant="light"
        fullWidth
        leftSection={<IconPlus size={14}/>}
        onClick={onAddCategory}
      >
        Add Category
      </Button>
    </Box>
  )
}
