import { parse } from 'csv-parse/sync'
import type { ParticipantResult } from '../../../../shared/types'
import { parseTime } from '../../Events/Edit/EventResults/utils'
import type { DataMapping } from './FileUploadModal'

// List of common variations for each field to help with auto-detection when mapping columns from uploaded files
const SOURCE_FIELD_CANDIDATES: Record<string, string[]> = {
  bibNumber: ['bib', 'bibnumber', 'number'],
  name: ['name', 'athlete', 'rider', 'fullname'],
  firstName: ['firstname', 'first'],
  lastName: ['lastname', 'last'],
  uciId: ['uciid', 'uci', 'ucilicence', 'ucilicense'],
  city: ['city', 'hometown'],
  province: ['province', 'state', 'region'],
  team: ['team', 'club', 'teamname'],
  license: ['license', 'licence', 'licensenumber'],
  age: ['age'],
  nationality: ['nationality', 'nation', 'country'],
  finishPosition: ['pos', 'position', 'place', 'rank', 'finishposition'],
  primes: ['prime', 'primes', 'sprint'],
  points: ['points', 'pts', 'seriepoints'],
  position: ['pos', 'position', 'place', 'rank'],
  finishTime: ['time', 'finishtime', 'finish', 'totaltime', 'racetime'],
  finishGap: ['gap', 'finishgap', 'timegap', 'timebehind'],
  avgSpeed: ['avgspeed', 'speed', 'averagespeed'],
  status: ['status', 'dnf', 'dns'],
}

export function createFieldFinder(sourceFields: string[]) {
  const normalizedFieldNames = sourceFields.map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''))

  return (...candidates: string[]) =>
    sourceFields[candidates.map(c => normalizedFieldNames.indexOf(c)).find(i => i >= 0) ?? -1] ?? null
}

// Look for requested fields in the original headers using common naming variations
export const autoDetectMapping = (
  sourceFields: string[],
  targetFields: string[]
): DataMapping => {
  const find = createFieldFinder(sourceFields)

  const mapping: DataMapping = {}

  for (const field of targetFields) {
    if (SOURCE_FIELD_CANDIDATES[field]) {
      mapping[field] = find(...SOURCE_FIELD_CANDIDATES[field])
    } else {
      throw new Error(`Unknown field requested for auto-detection: ${field}`)
    }
  }

  return mapping
}

export const parseHeaders = (csvData: string): string[] => {
  const rows = parse(csvData, {
    columns: true,
    skip_empty_lines: true,
    to_line: 2, // Only parse the first line to get headers
  }) as Record<string, string>[]

  if (!rows.length) throw new Error('Unable to parse headers from CSV data')

  return Object.keys(rows[0])
}

function parseAthleteName(
  row: Record<string, string>,
  mapping: { name?: string; firstName?: string; lastName?: string },
): { firstName?: string; lastName?: string } {
  const fullName = mapping.name ? row[mapping.name] : ''
  const firstName = (mapping.firstName && row[mapping.firstName]) || (fullName ? fullName.split(/\s+/)[0] : '') || undefined
  const lastName = (mapping.lastName && row[mapping.lastName]) || (fullName ? fullName.split(/\s+/).slice(1).join(' ') : '') || undefined

  return { firstName, lastName }
}

export const parseContentWithDataMapping = <T extends Record<string, any>>(
  csvData: string,
  dataMapping: DataMapping,
): T[] => {
  const dataRows = parse(csvData, {
    columns: true,
    skip_empty_lines: true,
  }) as Record<string, string>[]

  if (!dataRows.length) return []

  return dataRows.map((row) => {
    const parsedRow: Record<string, any> = {}

    Object.keys(dataMapping).forEach(k => {
      if (!dataMapping[k]) return

      parsedRow[k] = row[dataMapping[k]]

      // Handle special cases
      if (['finishPosition', 'bibNumber', 'points', 'primes', 'age'].includes(k)) {
        parsedRow[k] = parseInt(parsedRow[k]) || undefined
      } else if (k === 'avgSpeed') {
        parsedRow[k] = parseFloat(parsedRow[k]) || undefined
      } else if (k === 'finishTime') {
        parsedRow[k] = parseTime(parsedRow[k]) || undefined
      } else if (k === 'finishGap') {
        parsedRow[k] = parseTime(parsedRow[k]) || parseFloat(parsedRow[k]) || undefined
      } else if (k === 'status') {
        const statusRaw = (parsedRow[k] ?? '').toUpperCase()
        parsedRow[k] = ([
          'DNF',
          'DNS',
          'OTL'
        ].includes(statusRaw) ? statusRaw : 'FINISHER') as ParticipantResult['status']
      }
    })

    // Handle athlete name parsing separately since it can be split into first/last name or combined in a single field
    const { firstName, lastName } = parseAthleteName(row, dataMapping)
    parsedRow.firstName = firstName
    parsedRow.lastName = lastName

    return parsedRow as T
  })
}
