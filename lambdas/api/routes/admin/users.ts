import {
  AdminGetUserCommand,
  CognitoIdentityProviderClient,
  ListUsersCommand
} from '@aws-sdk/client-cognito-identity-provider'
import type { FastifyPluginAsync } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { AWS_DEFAULT_CONFIG } from 'shared/config.ts'
import { AdminUser } from 'shared/types.ts'
import z from 'zod'
import { AdminUserSchema } from '../../../../shared/schemas/adminUsers.ts'
import { AWS_COGNITO_USER_POOL_ID } from '../../config.ts'
import { ResponseErrorSchema } from '../../types.ts'
import { isSuperAdmin } from '../../utils/isSuperAdmin.ts'

const cognitoClient = new CognitoIdentityProviderClient(AWS_DEFAULT_CONFIG)

const getAttr = (attrs: { Name?: string, Value?: string }[], name: string) =>
  attrs.find(a => a.Name === name)?.Value ?? ''

export const userRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.withTypeProvider<ZodTypeProvider>().get('/users', {
    preHandler: [fastify.requireRaceDirector],
    schema: {
      response: {
        200: z.array(AdminUserSchema),
        403: ResponseErrorSchema,
      },
    },
  }, async (request, _response) => {
    if (!isSuperAdmin(request)) {
      const username = request.user!['cognito:username']
      const response = await cognitoClient.send(new AdminGetUserCommand({
        UserPoolId: AWS_COGNITO_USER_POOL_ID,
        Username: username,
      }))
      const attrs = response.UserAttributes ?? []
      return [
        {
          id: getAttr(attrs, 'sub'),
          name: getAttr(attrs, 'name'),
          email: getAttr(attrs, 'email'),
        }
      ] satisfies AdminUser[]
    }

    const users: AdminUser[] = []
    let paginationToken: string | undefined

    do {
      const response = await cognitoClient.send(new ListUsersCommand({
        UserPoolId: AWS_COGNITO_USER_POOL_ID,
        AttributesToGet: ['sub', 'name', 'email'],
        PaginationToken: paginationToken,
      }))

      for (const user of response.Users ?? []) {
        const attrs = user.Attributes ?? []
        users.push({
          id: getAttr(attrs, 'sub'),
          name: getAttr(attrs, 'name'),
          email: getAttr(attrs, 'email'),
        })
      }

      paginationToken = response.PaginationToken
    } while (paginationToken)

    return users
  })
}
