import * as React from 'react'
import { Badge, List, ThemeIcon } from '@mantine/core'
import { IconCircleCheck } from '@tabler/icons-react'

export type UpgradePointExplanationProps = {
  fieldSize?: number | null
  combinedCategories?: Record<string, string> | null
  selectedCategory?: string
  onCategoryClick?: (categoryAlias: string) => void
  eventTypeLabel?: string
  isDoubleUpgradePoints?: boolean
  children?: React.ReactNode
}

export const UpgradePointExplanation: React.FC<UpgradePointExplanationProps> = ({
  fieldSize,
  combinedCategories,
  selectedCategory,
  onCategoryClick,
  eventTypeLabel,
  isDoubleUpgradePoints,
  children
}) => {
  return (
    <>
      {children}

      <List
        spacing="xs"
        size="sm"
        style={{ marginTop: !!children ? '1rem' : 0 }}
        icon={
          <ThemeIcon color="teal" size={16} radius="xl">
            <IconCircleCheck size={16}/>
          </ThemeIcon>
        }
      >
        {fieldSize &&
          <List.Item styles={{ itemWrapper: { alignItems: 'flex-start' } }}>
            Field Size: {fieldSize} (excluding DNS)
            {!!combinedCategories && (
              <List icon={'-'}>
                <List.Item style={{ marginTop: '0.25rem' }} key="combined-categories">
                  {Object.keys(combinedCategories || {}).map((catAlias) => (
                    <Badge
                      key={catAlias}
                      variant={selectedCategory === catAlias ? 'filled' : 'light'}
                      style={{
                        color: selectedCategory === catAlias ? 'white' : 'black',
                        textTransform: 'none',
                        padding: '0 5px',
                        borderRadius: 5,
                        margin: '0 2px',
                        cursor: onCategoryClick ? 'pointer' : 'default',
                      }}
                      onClick={() => onCategoryClick?.(catAlias)}
                    >
                      {combinedCategories![catAlias]}
                    </Badge>
                  ))}
                </List.Item>
              </List>
            )}
          </List.Item>}

        {eventTypeLabel && <List.Item>Event
          Type: {eventTypeLabel} {isDoubleUpgradePoints && '(double upgrade points)'}</List.Item>}
      </List>
    </>
  )
}