import { s3 as RRS3 } from '../utils.ts'
import { MEMBERSHIP_OUTPUT_PATH } from '../../bc-membership-importer/config.ts'
import type { RawAthleteMembershipData } from '../../bc-membership-importer/types.ts'

export const getRawBCMembershipDates = async (): Promise<string[]> => {
  const { files } = await RRS3.fetchDirectoryFiles(MEMBERSHIP_OUTPUT_PATH)

  if (!files || files.length === 0) return []

  // Extract unique dates from file names in the format YYYY-MM-DD
  return files.filter(f => f.Key!.endsWith('.json'))
  .map((f) => {
    const filename = f.Key!.replace('.json', '').split('/').pop()!
    // Transform YYYYMMDD to YYYY-MM-DD
    return filename.slice(0, 4) + '-' + filename.slice(4, 6) + '-' + filename.slice(6, 8)
  })
  .sort()
}

export const getRawBCMembershipsForDate = async (date: string): Promise<Record<string, RawAthleteMembershipData | null>> => {
  // If date is in format YYYY-MM-DD, convert to YYYYMMDD
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    date = date.replace(/-/g, '')
  }

  const filename = MEMBERSHIP_OUTPUT_PATH + `${date}.json`

  const fileContent = await RRS3.fetchFile(filename, true)

  if (!fileContent) return {}

  return JSON.parse(fileContent) as Record<string, RawAthleteMembershipData | null>
}

export const updateRawBCMemberships = async (
  rawMemberships: Record<string, RawAthleteMembershipData | null>,
  date: string
): Promise<void> => {
  // If date is in format YYYY-MM-DD, convert to YYYYMMDD
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    date = date.replace(/-/g, '')
  }

  const filename = MEMBERSHIP_OUTPUT_PATH + `${date}.json`

  await RRS3.writeFile(filename, JSON.stringify(rawMemberships))
}