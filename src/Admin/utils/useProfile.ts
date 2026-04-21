import { useAuth } from 'react-oidc-context'

export const useProfile = () => {
  const { user } = useAuth()

  const organizerAlias = (user?.profile['custom:organizer_alias'] as string) || null
  const userGroups = (user?.profile['cognito:groups'] || []) as string[]
  const isAdmin = userGroups.includes('SuperAdmins')
  const isOrganizer = userGroups.includes('RaceDirectors')

  return {
    organizerAlias,
    isAdmin,
    isOrganizer,
  }
}