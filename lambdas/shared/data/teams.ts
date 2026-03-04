import { s3 as RRS3 } from '../utils.ts'
import { PUBLIC_BUCKET_FILES } from '../../../src/config/s3.ts'
import type { Team } from '../types.ts'

export const getTeams = async (): Promise<Record<string, Team>> => {
  const fileContent = await RRS3.fetchFile(PUBLIC_BUCKET_FILES.athletes.teams)

  if (!fileContent) return {}

  return JSON.parse(fileContent) as Record<string, Team>
}