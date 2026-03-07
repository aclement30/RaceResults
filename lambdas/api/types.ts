import type { FastifyReply, FastifyRequest } from 'fastify'

declare module 'fastify' {
  interface FastifyRequest {
    user?: CognitoUser;
  }

  interface FastifyInstance {
    requireAuth: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireAdmin: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireRole: (role: string) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

export type CognitoUser = {
  sub: string;
  email: string;
  email_verified: boolean;
  'custom:role'?: string;
  'cognito:username': string;
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