import type { FastifyReply, FastifyRequest } from 'fastify'
import { isSuperAdmin } from './isSuperAdmin'

export const requireOrganizerAccess = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
  const organizerAlias = request.user?.['custom:organizer_alias']

  if (!organizerAlias && !isSuperAdmin(request)) {
    reply.status(403).send({ error: 'Access denied. Organizer alias required for non-superadmin users.' })
    return
  }

  request.organizerAlias = isSuperAdmin(request) ? null : organizerAlias ?? null
}
