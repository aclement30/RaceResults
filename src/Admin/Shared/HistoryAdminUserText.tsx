import { useContext } from 'react'
import { AdminContext } from './AdminContext'

export const HistoryAdminUserText = ({ userId }: { userId?: string | null }) => {
  const { adminUsers } = useContext(AdminContext)

  if (!userId) return null

  return (
    <span>{adminUsers.find(u => u.id === userId)?.name || userId}</span>
  )
}