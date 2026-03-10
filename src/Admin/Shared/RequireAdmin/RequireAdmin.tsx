import React from 'react'
import { useAuth } from 'react-oidc-context'

interface RequireAdminProps {
  children: React.ReactNode
}

export const RequireAdmin: React.FC<RequireAdminProps> = ({ children }) => {
  const { user } = useAuth()

  const userGroups = (user?.profile['cognito:groups'] || []) as string[]
  const isAdmin = userGroups.includes('SuperAdmins')

  if (!isAdmin) {
    return null
  }

  return children
}