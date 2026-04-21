import React from 'react'
import { useProfile } from '../../utils/useProfile'

interface RequireAdminProps {
  children: React.ReactNode
}

export const RequireAdmin: React.FC<RequireAdminProps> = ({ children }) => {
  const { isAdmin } = useProfile()

  if (!isAdmin) {
    return null
  }

  return children
}

export const RequireOrganizer: React.FC<RequireAdminProps> = ({ children }) => {
  const { isAdmin, isOrganizer } = useProfile()

  if (!isAdmin && !isOrganizer) {
    return null
  }

  return children
}