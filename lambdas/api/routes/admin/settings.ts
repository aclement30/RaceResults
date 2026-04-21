import { ResponseErrorSchema } from '../../types.ts'
import { S3ServiceException } from '@aws-sdk/client-s3'
import type { FastifyPluginAsync } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { s3 as RRS3 } from 'shared/utils.ts'
import z from 'zod'
import { EDITABLE_FILES } from '../../../../shared/config.ts'

export const settingRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.withTypeProvider<ZodTypeProvider>().get('/settings/config-files/:filename', {
    preHandler: [fastify.requireSuperAdmin],
    schema: {
      params: z.object({
        filename: z.string(),
      }),
      response: {
        200: z.union([z.array(z.unknown()), z.record(z.string(), z.unknown())]),
        400: ResponseErrorSchema,
        403: ResponseErrorSchema,
        404: ResponseErrorSchema,
        500: ResponseErrorSchema,
      },
    },
  }, async (request, response) => {
    const { filename } = request.params

    const formattedFilename = decodeFilename(filename)

    if (!Object.keys(EDITABLE_FILES).includes(formattedFilename)) {
      response.status(403).send({ error: `Invalid query: ${formattedFilename} is not editable` })
      return
    }

    let fileContent
    try {
      fileContent = await RRS3.fetchFile(formattedFilename)
    } catch (error) {
      if (error instanceof S3ServiceException && error.name === 'NoSuchKey') {
        response.status(404).send({ error: `File ${formattedFilename} could not be found in S3 bucket` })
      }
    }

    if (!fileContent) {
      return response.status(500).send({ error: `File ${formattedFilename} is empty` })
    }

    return JSON.parse(fileContent as any)
  })

  fastify.withTypeProvider<ZodTypeProvider>().put('/settings/config-files/:filename', {
    preHandler: [fastify.requireSuperAdmin],
    schema: {
      params: z.object({
        filename: z.string(),
      }),
      body: z.union([z.array(z.unknown()), z.record(z.string(), z.unknown())]),
      response: {
        204: z.undefined(),
        400: ResponseErrorSchema,
        403: ResponseErrorSchema,
      },
    },
  }, async (request, response) => {
    const { filename } = request.params
    const fileContent = request.body
    const formattedFilename = decodeFilename(filename)

    if (!Object.keys(EDITABLE_FILES).includes(formattedFilename)) {
      response.status(403).send({ error: `Invalid query: ${formattedFilename} is not editable` })
      return
    }

    if (!fileContent) {
      response.status(400).send({ error: 'Invalid query: `body` is empty' })
      return
    }

    if (
      typeof fileContent !== 'object' ||
      fileContent === null ||
      (Array.isArray(fileContent) && fileContent.length === 0)
    ) {
      response.status(400).send({ error: 'Invalid body: must be a non-null JSON object or array' })
      return
    }

    await RRS3.writeFile(formattedFilename, JSON.stringify(fileContent))

    response.status(204).send()
  })
}

const decodeFilename = (fileName: string) => {
  // Replace `:` with `/` to get the original file path (e.g. `settings:appConfig.json` -> `settings/appConfig.json`)
  return fileName.replace(/:/g, '/')
}