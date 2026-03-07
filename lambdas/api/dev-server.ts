import { buildFastifyApp } from './index.ts'
import logger from '../shared/logger.ts'
import type { FastifyInstance } from 'fastify'
import type { RawWithRequestContext } from './types.ts'

const PORT = Number(process.env.PORT || 3001)

let app: FastifyInstance

const startDevServer = async () => {
  try {
    app = await buildFastifyApp()

    // Add dev auth context mock globally (after auth plugin, before routes)
    app.addHook('onRequest', async (request, reply) => {
      console.log('Dev server preHandler hook - mocking auth context')
      // Mock the requestContext structure that the AuthPlugin expects
      if (!(request.raw as RawWithRequestContext).requestContext) {
        (request.raw as RawWithRequestContext).requestContext = {
          authorizer: request.headers.authorization ? {
            claims: {
              email: 'test@domain.com',
              sub: 'dev-user-123',
              'cognito:username': 'dev-user',
              'custom:role': 'admin' // Set as admin for dev convenience
            }
          } : undefined
        }
      }
    })

    // Start the server
    await app.listen({
      port: PORT,
      host: '0.0.0.0'
    })

    console.log(`
🚀 Lambda Dev Server

🔗 Server URL: http://localhost:${PORT}/api/stage
🩺 Health: http://localhost:${PORT}/health
`)

  } catch (error) {
    logger.error('Failed to start development server', { error })
    process.exit(1)
  }
}

startDevServer()

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully')
  if (app) {
    await app.close()
    logger.info('Fastify server closed')
  }
  process.exit(0)
})

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { error })
  process.exit(1)
})

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', {
    reason,
    promise: promise.toString()
  })
  process.exit(1)
})

process.on('SIGINT', async () => {
  if (app) {
    await app.close()
  }
  process.exit(0)
})
