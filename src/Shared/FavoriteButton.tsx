import * as React from 'react'
import { ActionIcon, Button, Tooltip } from '@mantine/core'
import { IconStar, IconStarFilled } from '@tabler/icons-react'

type FavoriteButtonProps = {
  isFavorite: boolean
  onClick: () => void,
  className?: string
  iconOnly?: boolean
}

export const FavoriteButton: React.FC<FavoriteButtonProps> = ({ isFavorite, className, iconOnly, onClick }) => {
  const icon = isFavorite ? <IconStarFilled size={20}/> : <IconStar size={20}/>
  const label = isFavorite ? 'Remove from Favorites' : 'Add to Favorites'

  if (iconOnly) {
    return (
      <Tooltip label={label}>
        <ActionIcon variant="subtle" onClick={onClick} size="md" aria-label={label}
                    className={className}>{icon}</ActionIcon>
      </Tooltip>
    )
  }

  return (
    <Button variant="subtle" leftSection={icon} onClick={onClick} size="sm" className={className}>
      {label}
    </Button>
  )
}