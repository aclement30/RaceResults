import { awsLambdaFastify } from '@fastify/aws-lambda'
import cors from '@fastify/cors'
import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import fastify, { type FastifyError } from 'fastify'
import { serializerCompiler, validatorCompiler, type ZodTypeProvider } from 'fastify-type-provider-zod'

import { CORS } from 'shared/config.ts'
import logger from 'shared/logger.ts'

import { authPlugin } from './plugins/auth.ts'
import { adminRoutes } from './routes/admin.ts'

const ENV = process.env.ENV || 'dev'
export const BASE_PATH = ENV === 'prod' ? '/api' : '/api/stage'

export async function buildFastifyApp() {
  const app = fastify({
    logger: false // We'll use our shared logger instead
  }).withTypeProvider<ZodTypeProvider>()
  app.setValidatorCompiler(validatorCompiler)
  app.setSerializerCompiler(serializerCompiler)

  await app.register(cors, {
    origin: CORS.allowedOrigins,
    methods: CORS.allowedMethods,
    allowedHeaders: CORS.allowedHeaders,
    credentials: CORS.credentials,
  })

  // Register plugins first
  await app.register(authPlugin)

  app.addHook('onError', async (request, reply, error) => {
    if (error.code === 'FST_ERR_RESPONSE_SERIALIZATION') {
      if (process.env.NODE_ENV === 'development') {
        console.error('Serialization Error:', {
          message: error.message,
          cause: (error as any).cause,
          url: request.url,
          method: request.method
        })
      } else {
        logger.error('Response serialization error', {
          error: {
            message: error.message,
            cause: (error as any).cause,
          },
          request: {
            method: request.method,
            url: request.url,
          },
        })
      }
    } else {
      console.error('Error:', {
        message: error.message,
        cause: (error as any).cause,
        url: request.url,
        method: request.method
      })
    }
  })

  // Error handling hooks
  app.setErrorHandler(async (error: FastifyError, request, reply) => {
    // Log full error in development
    if (process.env.NODE_ENV === 'development') {
      console.error(error)
    } else {
      // Log the error with Lambda context if available
      logger.error(error, {
        request: {
          method: request.method,
          url: request.url,
          params: request.params,
          query: request.query,
          userAgent: request.headers['user-agent'],
          requestId: (request.raw as any).requestContext?.requestId
        },
        lambda: {
          functionName: process.env.AWS_LAMBDA_FUNCTION_NAME,
          functionVersion: process.env.AWS_LAMBDA_FUNCTION_VERSION,
          stage: ENV
        }
      })
    }

    // Send appropriate error response
    const statusCode = error.statusCode || 500
    const message = statusCode >= 500 ? 'Internal Server Error' : error.message

    return reply.status(statusCode).send({
      error: message,
      statusCode,
      timestamp: new Date().toISOString(),
      requestId: (request.raw as any).requestContext?.requestId
    })
  })

  await app.register(adminRoutes, { prefix: `${BASE_PATH}/admin` })

  // Debug route to inspect JWT contents
  app.get(`${BASE_PATH}/debug/auth`, {
    preHandler: [app.requireAuth]
  }, async (request, reply) => {
    const authHeader = request.headers.authorization

    // Decode the raw JWT to see all claims
    const jwt = require('jsonwebtoken')
    const decoded = jwt.decode(authHeader, { complete: true })

    return {
      message: 'Auth debug info',
      user: request.user,
      rawJwtHeader: decoded?.header,
      rawJwtPayload: decoded?.payload,
      availableClaims: Object.keys(decoded?.payload || {}),
      customAttributes: Object.keys(decoded?.payload || {})
      .filter(key => key.startsWith('custom:'))
      .reduce((acc, key) => {
        acc[key] = decoded?.payload[key]
        return acc
      }, {} as Record<string, any>)
    }
  })

  app.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString()
  }))

  // Hook for not found routes
  app.setNotFoundHandler(async (request, reply) => {
    logger.warn('Route not found', {
      request: {
        method: request.method,
        url: request.url,
        requestId: (request.raw as any).requestContext?.requestId
      },
      lambda: {
        functionName: process.env.AWS_LAMBDA_FUNCTION_NAME,
        stage: ENV
      }
    })

    return reply.status(404).send({
      error: 'Not Found',
      statusCode: 404,
      message: `Route ${request.method} ${request.url} not found`,
      timestamp: new Date().toISOString(),
      requestId: (request.raw as any).requestContext?.requestId
    })
  })

  // Request logging hook
  app.addHook('preHandler', async (request) => {
    // Skip OPTIONS requests
    if (request.method === 'OPTIONS') return

    logger.info('Request received', {
      request: {
        method: request.method,
        url: request.url,
        userAgent: request.headers['user-agent'],
        requestId: (request.raw as any).requestContext?.requestId,
        sourceIp: (request.raw as any).requestContext?.http?.sourceIp
      },
      lambda: {
        functionName: process.env.AWS_LAMBDA_FUNCTION_NAME,
        stage: ENV
      }
    })
  })

  return app
}

let cachedProxy: ((event: any, context: any) => Promise<any>) | null = null

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  try {
    if (!cachedProxy) {
      logger.info('Initializing Lambda function', {
        lambda: {
          functionName: process.env.AWS_LAMBDA_FUNCTION_NAME,
          functionVersion: process.env.AWS_LAMBDA_FUNCTION_VERSION,
          stage: ENV,
          requestId: context.awsRequestId
        }
      })

      const app = await buildFastifyApp()
      cachedProxy = awsLambdaFastify(app)
    }

    return await cachedProxy(event, context)
  } catch (error) {
    logger.error('Lambda handler error', {
      error,
      lambda: {
        functionName: process.env.AWS_LAMBDA_FUNCTION_NAME,
        requestId: context.awsRequestId,
        event: {
          httpMethod: event.requestContext.http.method,
          path: event.rawPath,
        }
      }
    })

    // Return a proper Lambda response for unhandled errors
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      },
      body: JSON.stringify({
        error: 'Internal Server Error',
        statusCode: 500,
        timestamp: new Date().toISOString(),
        requestId: context.awsRequestId
      })
    }
  }
}

// Process error handlers for Lambda environment
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception in Lambda', {
    error,
    lambda: {
      functionName: process.env.AWS_LAMBDA_FUNCTION_NAME,
      functionVersion: process.env.AWS_LAMBDA_FUNCTION_VERSION
    }
  })
  // In Lambda, we don't exit the process as it will be reused
})

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection in Lambda', {
    reason,
    promise: promise.toString(),
    lambda: {
      functionName: process.env.AWS_LAMBDA_FUNCTION_NAME,
      functionVersion: process.env.AWS_LAMBDA_FUNCTION_VERSION
    }
  })
  // In Lambda, we don't exit the process as it will be reused
})