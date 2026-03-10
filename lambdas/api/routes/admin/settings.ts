import type { FastifyReply, FastifyRequest } from 'fastify'
import { s3 as RRS3 } from '../../../shared/utils.ts'

const EDITABLE_CONFIG_FILES = [
  'athlete_duplicates.json',
  'athlete_manual_edits.json',
  'athlete_overrides.json',
  'athlete_upgrade_dates.json',
  'athletes_lookup.json',
  'athletes_skill_categories.json',
  'event_days.json',
]

export const GetConfigurationFileRoute = async (
  request: FastifyRequest<{ Params: { filename: string } }>,
  response: FastifyReply
) => {
  const { filename } = request.params

  if (!filename) {
    response.status(400).send({ error: 'Invalid query: `filename` is missing' })
    return
  }

  if (!EDITABLE_CONFIG_FILES.includes(filename)) {
    response.status(403).send({ error: `Invalid query: ${filename} is not editable` })
    return
  }

  const fileContent = await RRS3.fetchFile(filename, true)

  if (!fileContent) {
    return null
  }

  return JSON.parse(fileContent as any)
}

export const PutConfigurationFileRoute = async (
  request: FastifyRequest<{ Params: { filename: string }, Body: any }>,
  response: FastifyReply
) => {
  const { filename } = request.params
  const fileContent = request.body

  if (!filename) {
    response.status(400).send({ error: 'Invalid query: `filename` is missing' })
    return
  }

  if (!EDITABLE_CONFIG_FILES.includes(filename)) {
    response.status(403).send({ error: `Invalid query: ${filename} is not editable` })
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
  
  await RRS3.writeFile(filename, JSON.stringify(fileContent))

  response.status(204).send()
}