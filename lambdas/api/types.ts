import type { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

export const ResponseErrorSchema = z.object({ error: z.string() })

declare module 'fastify' {
  interface FastifyRequest {
    user?: CognitoUser;
    organizerAlias: string | null;
  }

  interface FastifyInstance {
    requireAuth: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireAdmin: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireSuperAdmin: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireRaceDirector: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireGroups: (allowedGroups: string[], errorMessage?: string) => (
      request: FastifyRequest,
      reply: FastifyReply
    ) => Promise<void>;
    requireAnyGroup: (groups: string[]) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireRole: (role: string) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

export type CognitoUser = {
  sub: string;
  email: string;
  email_verified: boolean;
  'custom:role'?: string;
  'cognito:username': string;
  'cognito:groups'?: string[];
  'custom:organizer_alias'?: string;
  aud: string;
  iss: string;
  exp: number;
  iat: number;
}

export type AuthenticatedRequest = {
  user: CognitoUser
}

export type AuthError = {
  error: string;
}

export type RawWithRequestContext = FastifyRequest['raw'] & {
  requestContext?: {
    authorizer?: {
      jwt?: {
        claims: Record<string, string>
      }
    }
  }
}