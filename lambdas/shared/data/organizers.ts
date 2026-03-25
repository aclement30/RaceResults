import { s3 as RRS3 } from '../utils.ts'
import { PUBLIC_BUCKET_FILES } from '../../../src/config/s3.ts'
import type { Organizer } from '../types.ts'

export const getOrganizers = async (): Promise<Organizer[]> => {
  const fileContent = await RRS3.fetchFile(PUBLIC_BUCKET_FILES.organizers)

  if (!fileContent) return []

  return JSON.parse(fileContent) as Organizer[]
}