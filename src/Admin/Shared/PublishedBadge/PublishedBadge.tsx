import { Badge } from '@mantine/core'
import { IconCopyCheckFilled, IconEyeOff } from '@tabler/icons-react'
import React from 'react'

type PublishedBadgeProps = {
  published: boolean
}

export const PublishedBadge: React.FC<PublishedBadgeProps> = ({ published }) => {
  return published
    ? <Badge color="green" leftSection={<IconCopyCheckFilled size={10}/>}>Published</Badge>
    : <Badge color="gray" variant="outline" leftSection={<IconEyeOff size={10}/>}>Draft</Badge>
}