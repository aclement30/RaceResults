import fp from 'fastify-plugin'
import jwt from 'jsonwebtoken'
import type { AuthError, CognitoUser } from '../types.ts'
import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify'

const AuthPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.decorate('requireAuth', async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    // Parse JWT from Authorization header instead of requestContext
    const authHeader = request.headers.authorization
    if (!authHeader) {
      reply.code(401).send({ error: 'Authentication required' } as AuthError)
      return
    }

    try {
      // Decode JWT without verification (Cognito pre-verified it)
      const decoded = jwt.decode(authHeader) as CognitoUser
      if (!decoded) {
        reply.code(401).send({ error: 'Invalid token' } as AuthError)
        return
      }

      request.user = decoded
    } catch (error) {
      reply.code(401).send({ error: 'Invalid token' } as AuthError)
      return
    }
  })

  // Generic group checker
  fastify.decorate('requireGroups', (allowedGroups: string[], errorMessage?: string) => {
    return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
      await fastify.requireAuth(request, reply)
      if (reply.sent) return

      const userGroups = request.user?.['cognito:groups'] || []
      const hasRequiredGroup = allowedGroups.some(group => userGroups.includes(group))

      if (!hasRequiredGroup) {
        reply.code(403).send({
          error: errorMessage || `Access denied. Requires one of: ${allowedGroups.join(', ')}`
        } as AuthError)
        return
      }
    }
  })

  // Specific permission levels
  fastify.decorate('requireSuperAdmin', async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    await fastify.requireGroups(['SuperAdmins'], 'Superadmin access required')(request, reply)
  })

  fastify.decorate('requireRaceDirector', async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    await fastify.requireGroups([
      'RaceDirectors',
      'SuperAdmins'
    ], 'Race director or superadmin access required')(request, reply)
  })

  fastify.decorate('requireAdmin', async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    await fastify.requireGroups(['SuperAdmins'], 'Admin access required')(request, reply)
  })

  // Flexible permission checker
  fastify.decorate('requireAnyGroup', (groups: string[]) => {
    return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
      await fastify.requireAuth(request, reply)
      if (reply.sent) return

      const userGroups = request.user?.['cognito:groups'] || []
      const hasAccess = groups.some(group => userGroups.includes(group))

      if (!hasAccess) {
        reply.code(403).send({
          error: `Access denied. Requires one of: ${groups.join(', ')}`
        } as AuthError)
        return
      }
    }
  })
}

export const authPlugin = fp(AuthPlugin)