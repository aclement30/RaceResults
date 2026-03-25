import type { ParticipantResult } from '../../../../../../shared/types'
import { parseTime } from '../utils'
import type { ColumnMapping } from './FileUploadModal'

// Attempt to auto-detect mapping based on header names
export function autoDetect(headers: string[]): ColumnMapping {
  const normalized = headers.map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''))
  const find = (...candidates: string[]) =>
    headers[candidates.map(c => normalized.indexOf(c)).find(i => i >= 0) ?? -1] ?? null

  return {
    position: find('pos', 'position', 'place', 'rank'),
    bib: find('bib', 'bibnumber', 'number'),
    name: find('name', 'athlete', 'rider', 'fullname'),
    firstName: find('firstname', 'first'),
    lastName: find('lastname', 'last'),
    team: find('team', 'club', 'teamname'),
    finishTime: find('time', 'finishtime', 'finish', 'totaltime', 'racetime'),
    finishGap: find('gap', 'finishgap', 'timegap', 'timebehind'),
    avgSpeed: find('avgspeed', 'speed', 'averagespeed'),
    status: find('status', 'dnf', 'dns'),
    uciId: find('uciid', 'uci', 'ucilicence', 'ucilicense'),
    city: find('city', 'hometown'),
    province: find('province', 'state', 'region'),
    license: find('license', 'licence', 'licensenumber'),
    age: find('age'),
    nationality: find('nationality', 'nation', 'country'),
  }
}

export function parseWithMapping(
  content: string,
  mapping: ColumnMapping,
): ParticipantResult[] {
  const lines = content.trim().split(/\r?\n/)
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))

  const col = (row: string[], header: string | null) => {
    if (!header) return ''
    const idx = headers.indexOf(header)
    return idx >= 0 ? row[idx]?.trim().replace(/^"|"$/g, '') ?? '' : ''
  }

  return lines
  .slice(1)
  .filter(l => l.trim())
  .map((line, i) => {
    const row = line.split(',')
    const statusRaw = col(row, mapping.status).toUpperCase()
    const status = (['DNF', 'DNS', 'OTL'].includes(statusRaw)
      ? statusRaw
      : 'FINISHER') as ParticipantResult['status']

    const fullName = col(row, mapping.name)
    const firstName = col(row, mapping.firstName) || (fullName ? fullName.split(/\s+/)[0] : '') || undefined
    const lastName = col(row, mapping.lastName) || (fullName ? fullName.split(/\s+/).slice(1).join(' ') : '') || undefined

    const finishGapRaw = col(row, mapping.finishGap)
    const avgSpeedRaw = col(row, mapping.avgSpeed)
    const ageRaw = col(row, mapping.age)
    const teamRaw = col(row, mapping.team)

    return {
      participantId: `p-${Date.now()}-${i}`,
      position: parseInt(col(row, mapping.position)) || i + 1,
      bibNumber: parseInt(col(row, mapping.bib)) || undefined,
      firstName,
      lastName,
      team: teamRaw || undefined,
      finishTime: parseTime(col(row, mapping.finishTime)),
      finishGap: finishGapRaw ? parseTime(finishGapRaw) || parseFloat(finishGapRaw) || undefined : undefined,
      avgSpeed: avgSpeedRaw ? parseFloat(avgSpeedRaw) || undefined : undefined,
      status,
      uciId: col(row, mapping.uciId) || undefined,
      city: col(row, mapping.city) || undefined,
      province: col(row, mapping.province) || undefined,
      license: col(row, mapping.license) || undefined,
      age: ageRaw ? parseInt(ageRaw) || undefined : undefined,
      nationality: col(row, mapping.nationality) || undefined,
    }
  })
}