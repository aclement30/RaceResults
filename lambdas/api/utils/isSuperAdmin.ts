import type { FastifyRequest } from 'fastify'

export const isSuperAdmin = (request: FastifyRequest): boolean => {
  const user = request.user
  const userGroups = user?.['cognito:groups'] || []

  // Check user permissions
  return userGroups.includes('SuperAdmins')
}