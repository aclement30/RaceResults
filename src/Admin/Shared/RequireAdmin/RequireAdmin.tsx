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