import React from 'react'
import { Center, Stack, Title, Text, Button } from '@mantine/core'

export interface EntityNotFoundProps {
  /** Icon component to display */
  icon?: React.ComponentType<{ size?: number; color?: string }>
  /** Icon size in pixels */
  iconSize?: number
  /** Title text */
  title: string
  /** Description text */
  description?: string
  /** Button text (optional) */
  buttonText?: string
  /** Button click handler (optional) */
  onButtonClick?: () => void
  /** Button variant */
  buttonVariant?: 'filled' | 'light' | 'outline' | 'subtle' | 'default'
  /** Minimum height for the container */
  minHeight?: string | number
  /** Additional margin top */
  mt?: string | number
}

/**
 * Reusable component for when an entity is not found or unavailable
 */
export const EntityNotFound: React.FC<EntityNotFoundProps> = ({
  icon: Icon,
  iconSize = 64,
  title,
  description,
  buttonText,
  onButtonClick,
  buttonVariant = 'light',
  minHeight = '400px',
  mt = 'xl'
}) => {
  return (
    <Center mt={mt} style={{ minHeight }}>
      <Stack align="center" gap="md">
        {Icon && (
          <Icon
            size={iconSize}
            color="var(--mantine-color-dimmed)"
          />
        )}

        <Title order={2} c="dimmed">
          {title}
        </Title>

        {description && (
          <Text c="dimmed" size="lg" ta="center">
            {description}
          </Text>
        )}

        {buttonText && onButtonClick && (
          <Button
            variant={buttonVariant}
            onClick={onButtonClick}
          >
            {buttonText}
          </Button>
        )}
      </Stack>
    </Center>
  )
}