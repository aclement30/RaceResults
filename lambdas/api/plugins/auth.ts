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

  fastify.decorate('requireAdmin', async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    await fastify.requireAuth(request, reply)

    if (reply.sent) return

    // const userRole = request.user?.['custom:role'] as UserRole || 'user'
    // if (userRole !== 'admin') {
    //   reply.code(403).send({ error: 'Admin access required' } as AuthError)
    //   return
    // }
  })

  // fastify.decorate('requireRole', (requiredRole: UserRole) => {
  //   return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
  //     await fastify.requireAuth(request, reply)
  //
  //     if (reply.sent) return
  //
  //     const userRole = request.user?.['custom:role'] as UserRole || 'user'
  //     if (userRole !== requiredRole) {
  //       reply.code(403).send({
  //         error: `${requiredRole} access required`
  //       } as AuthError)
  //       return
  //     }
  //   }
  // })
}

export const authPlugin = fp(AuthPlugin)