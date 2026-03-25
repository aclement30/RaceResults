import { uniq } from 'lodash-es'

import { PARTICIPANT_STATUSES } from '../../shared/schemas/events.ts'
import { AwsS3Client } from './aws-s3.ts'
import { RR_S3_BUCKET } from './config.ts'
import type { TParticipantStatus } from './types.ts'

export const s3 = new AwsS3Client(RR_S3_BUCKET)

export function validateYear(year: string | number) {
  if (isNaN(+year)) return false

  return +year >= 2020 && +year <= new Date().getFullYear()
}

export const formatProvince = (province: string | null | undefined): string | undefined => {
  if (!province || !province.length) return

  const formattedProvince = province.trim().toUpperCase()

  switch (formattedProvince) {
    case 'BC':
    case 'BRITISH COLUMBIA':
      return 'BC'
    case 'AB':
    case 'ALBERTA':
      return 'AB'
    case 'SK':
    case 'SASKATCHEWAN':
      return 'SK'
    case 'MB':
    case 'MANITOBA':
      return 'MB'
    case 'ON':
    case 'ONTARIO':
      return 'ON'
    case 'QC':
    case 'QUEBEC':
      return 'QC'
    case 'NB':
    case 'NEW BRUNSWICK':
      return 'NB'
    case 'NS':
    case 'NOVA SCOTIA':
      return 'NS'
    case 'PEI':
    case 'PRINCE EDWARD ISLAND':
      return 'PE'
    case 'NL':
    case 'NEWFOUNDLAND AND LABRADOR':
      return 'NL'
    case 'WASHINGTON':
      return 'WA'
    case 'OREGON':
      return 'OR'
    default:
      return formattedProvince
  }
}

export const formatStatus = (status: string | null | undefined): TParticipantStatus | null => {
  if (!status || !status.length) return null

  const formattedStatus = status.trim().toUpperCase()

  if (PARTICIPANT_STATUSES.includes(formattedStatus as any)) return formattedStatus as TParticipantStatus

  return null
}

export const capitalize = <T extends string | undefined | null>(str: T): T => {
  if (str == null || str === undefined) return str

  // @ts-ignore
  return str.toLowerCase().replace(/(?:^|\s|-|["'([{])+\S/g, match => match.toUpperCase())
}

export const findCommonValue = <T>(objects: Record<string, any>[], field: string): T | undefined => {
  const commonValues: T[] = uniq(objects.map(o => o[field]))

  if (commonValues?.length === 1) return commonValues[0]

  return undefined
}

// Calculate lap gaps for each rider compared to the first rider past the line in each lap
export const calculateLapGaps = <T extends { participantId: string; lapTimes?: number[] }>(
  results: T[],
  lapCount: number
): Array<T & { lapGaps?: Array<number | null> }> => {
  const lapGaps: Record<string, Array<number | null>> = {}

  // For each lap, find the first rider past the line and calculate the gap for each rider compared to that first rider
  for (let i = 1; i < lapCount + 1; i++) {
    const firstRiderPastTheLine = results.reduce((
      prev,
      curr
    ) => !curr.lapTimes?.[i] || prev.lapTimes![i] < curr.lapTimes?.[i] ? prev : curr)

    results.forEach(({ participantId, lapTimes }) => {
      const riderGapInCurrentLap = lapTimes![i] ? lapTimes![i] - firstRiderPastTheLine.lapTimes![i] : null

      if (!lapGaps.hasOwnProperty(participantId)) lapGaps[participantId] = []
      lapGaps[participantId].push(riderGapInCurrentLap)
    })
  }

  return results.map((result) => ({
    ...result,
    lapGaps: lapGaps[result.participantId] || undefined,
  }))
}

export const convertLocalDateToUTC = (localStr: string, timeZone: string): Date => {
  const date = new Date(localStr.replace(' ', 'T'))
  const utc = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }))
  const local = new Date(date.toLocaleString('en-US', { timeZone }))
  return new Date(date.getTime() + utc.getTime() - local.getTime())
}