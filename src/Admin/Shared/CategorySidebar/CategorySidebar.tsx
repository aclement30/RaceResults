import { Box, Button, Stack, Text } from '@mantine/core'
import { IconPlus } from '@tabler/icons-react'
import React from 'react'
import type { BaseCategory } from '../../../../shared/types'
import { CategoryCard } from './CategoryCard/CategoryCard'

type CategorySidebarProps<T extends BaseCategory> = {
  categories: T[]
  activeCategory: string | null
  dirtyCategories?: Set<string>
  onSelectCategory: (alias: string) => void
  onEditCategory: (alias: string) => void
  onDeleteCategory: (alias: string) => void
  onReorderCategories: (categories: T[]) => void
  onAddCategory: () => void
}

export const CategorySidebar = <T extends BaseCategory>(
  {
    categories,
    activeCategory,
    dirtyCategories,
    onSelectCategory,
    onEditCategory,
    onDeleteCategory,
    onReorderCategories,
    onAddCategory
  }: CategorySidebarProps<T>
): React.ReactElement => {
  const topLevel = categories.filter(c => !c.parentCategory)

  const subCategoryMap = new Map<string, T[]>()
  categories.forEach(c => {
    if (c.parentCategory) {
      const list = subCategoryMap.get(c.parentCategory) ?? []
      list.push(c)
      subCategoryMap.set(c.parentCategory, list)
    }
  })

  const buildFlatArray = (newTopLevel: T[], newSubMap: Map<string, T[]>) => {
    return newTopLevel.flatMap(c => [c, ...(newSubMap.get(c.alias) ?? [])])
  }

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
        {topLevel.map((category, idx) => (
          <React.Fragment key={category.alias}>
            <CategoryCard
              category={category}
              isActive={activeCategory === category.alias}
              isDirty={dirtyCategories?.has(category.alias) ?? false}
              canMoveUp={idx > 0}
              canMoveDown={idx < topLevel.length - 1}
              onSelect={onSelectCategory}
              onEdit={onEditCategory}
              onDelete={onDeleteCategory}
              onMoveUp={() => handleMoveTopLevel(category.alias, 'up')}
              onMoveDown={() => handleMoveTopLevel(category.alias, 'down')}
            />

            {(subCategoryMap.get(category.alias) ?? []).map((sub, subIdx, siblings) => (
              <CategoryCard
                key={sub.alias}
                category={sub}
                isActive={activeCategory === category.alias}
                isDirty={dirtyCategories?.has(category.alias) ?? false}
                indent
                canMoveUp={subIdx > 0}
                canMoveDown={subIdx < siblings.length - 1}
                onSelect={onSelectCategory}
                onEdit={onEditCategory}
                onDelete={onDeleteCategory}
                onMoveUp={() => handleMoveSub(sub.alias, category.alias, 'up')}
                onMoveDown={() => handleMoveSub(sub.alias, category.alias, 'down')}
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
