import type { ParticipantResult } from '../../../../../shared/types'

export function formatTime(seconds: number): string {
  if (!seconds) return ''
  const total = Math.round(seconds)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

export function parseTime(timeStr: string): number {
  const s = timeStr.trim().replace(',', '.')
  if (!s) return 0
  if (/^\d+(\.\d+)?$/.test(s)) return Math.round(parseFloat(s))
  const parts = s.split(':').map(p => parseFloat(p))
  if (parts.some(isNaN)) return 0
  if (parts.length === 3) return Math.round(parts[0] * 3600 + parts[1] * 60 + parts[2])
  if (parts.length === 2) return Math.round(parts[0] * 60 + parts[1])
  return 0
}

export function participantName(result: Pick<ParticipantResult, 'firstName' | 'lastName'>): string {
  return [result.firstName, result.lastName].filter(Boolean).join(' ')
}
