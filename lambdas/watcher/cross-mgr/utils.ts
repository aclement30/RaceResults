import { startCase } from 'lodash-es'
import type { EventSummary, SerieSummary } from '../../../src/types/results.ts'
import { capitalize, formatProvince, transformCategory as defaultTransformCategory } from '../../shared/utils.ts'
import type { CrossMgrEventBundle } from './types.ts'

export const transformCategory = (
  catName: string,
  eventSummary: Pick<EventSummary | SerieSummary, 'name' | 'year' | 'organizerAlias'>
): string => {
  if (eventSummary.organizerAlias === 'EscapeVelocity') {
    if (eventSummary.name.includes('WTNC') && eventSummary.year === 2025) {
      switch (catName.toLowerCase()) {
        case 'm-a (men)':
          return 'Men/Youth 1/2 (M-A)'
        case 'ma-a (men)':
          return 'Men 1/2 (MA-A)'
        case 'my-a (men)':
          return 'Youth M1/2 (MY-A)'
        case 'wa-a (women)':
          return 'Women 1/2/3 (WA-A)'
        case 'wy-a (women)':
          return 'Youth W1/2/3 (WY-A)'
        case 'w-a (women)':
          return 'Women/Youth 1/2/3 (W-A)'
        case 'ma-b (men)':
          return 'Men 3 (MA-B)'
        case 'my-b (men)':
          return 'Youth M3 (MY-B)'
        case 'm-b (men)':
          return 'Men/Youth 3 (M-B)'
        case 'wa-b (women)':
          return 'Women 4/5 (WA-B)'
        case 'wy-b (women)':
          return 'Youth W4/5 (WY-B)'
        case 'w-b (women)':
          return 'Women/Youth 4/5 (W-B)'
        case 'ma-c (men)':
          return 'Men 4 (MA-C)'
        case 'my-c (men)':
          return 'Youth M4 (MY-C)'
        case 'm-c (men)':
          return 'Men/Youth 4 (M-C)'
        case 'ma-d (men)':
          return 'Men 5 (MA-D)'
        case 'my-d (men)':
          return 'Youth M5 (MY-D)'
        case 'm-d (men)':
          return 'Men/Youth 5 (M-D)'
        case 'ma-masters (men)':
          return 'Gentlemen of Leisure'
      }
    }
  } else if (eventSummary.name === 'BC Provincial Crit' && eventSummary.year === 2025) {
    if (catName === '<CategoryName> (Open)') return 'Master C-D (M)'
  } else if (eventSummary.name === 'Murchie' && eventSummary.year === 2025) {
    if (catName === 'Elite (Women)') {
      return 'Elite 1/2/3 (W)'
    } else if (catName === 'Cat 3/4/5 (Women)') {
      return 'Cat 4/5 (W)'
    }
  }

  return defaultTransformCategory(catName)
}

export const transformOrganizer = (alias: string, name: string): {
  organizerAlias: string,
  organizerOrg?: string,
  organizerName: string
} => {
  switch (name) {
    case 'M1':
      return {
        organizerAlias: 'Concord',
        organizerOrg: 'Concord',
        organizerName: name,
      }
    case 'Shims Ride':
      return {
        organizerAlias: 'ShimsRide',
        organizerName: 'Shim\'s Ride',
        organizerOrg: 'Shim\'s Ride',
      }
    default: {
      if (name.includes('Escape Velocity') && alias !== 'Thrashers') {
        return {
          organizerAlias: 'EscapeVelocity',
          organizerOrg: 'Escape Velocity',
          organizerName: name,
        }
      }
      if (name.includes('Barry')) {
        return {
          organizerAlias: 'LocalRide',
          organizerOrg: 'LocalRide',
          organizerName: name,
        }
      }
      if (name.includes('Drew') || name.includes('Andrew Nelson')) {
        return {
          organizerAlias: 'Thrashers',
          organizerOrg: 'Thrashers',
          organizerName: name,
        }
      }
    }
  }

  switch (alias) {
    case 'GoodRideGravel':
      return {
        organizerAlias: alias,
        organizerOrg: 'GOODRIDE Gravel',
        organizerName: name,
      }
    case 'RideForWater':
      return {
        organizerAlias: alias,
        organizerOrg: 'Ride For Water',
        organizerName: name,
      }
    case 'Thrashers':
      return {
        organizerAlias: 'Thrashers',
        organizerOrg: 'Thrashers',
        organizerName: name.includes('Escape Velocity') ? 'Thrashers' : name,
      }
    case 'GastownGrandPrix':
      return {
        organizerAlias: 'GastownGP',
        organizerOrg: 'Gastown GP',
        organizerName: name,
      }
    case 'TOURdeCONCORD':
      return {
        organizerAlias: 'Concord',
        organizerOrg: 'Concord',
        organizerName: name,
      }
    case 'LMCX2024':
      if (name === 'Ian') {
        return {
          organizerAlias: 'WestCoastCycling',
          organizerOrg: 'West Coast Cycling',
          organizerName: name,
        }
      }
  }

  return {
    organizerAlias: alias,
    organizerName: name,
  }
}

export const transformOrganizerAlias = (alias: string): string => {
  switch (alias) {
    case 'LMCX2024':
      return 'Thrashers'
    case 'WTNC2024':
      return 'EscapeVelocity'
  }

  return alias
}

export const transformSerieAlias = (serieAlias: string | null | undefined, organizerAlias: string) => {
  switch (organizerAlias) {
    case 'WTNC2024':
    case 'LMCX2024':
    case 'SS2023':
    case 'WTNC2023':
    case 'SS2022':
    case 'WTNC2022':
    case 'WTNC2021':
      return organizerAlias
    default:
      if (serieAlias?.toUpperCase().startsWith('SEYMOUR')) return undefined

      return serieAlias
  }
}

export const transformLocation = (locationStr: string): { city: string, province: string, country: 'CA' | 'US' } => {
  const parts = locationStr.split(',')

  return {
    city: capitalize(parts[0].trim()),
    province: formatProvince(parts[1].trim().toUpperCase())!,
    country: parts[2]?.trim().toUpperCase().slice(0, 2) as 'CA' | 'US',
  }
}

export const formatSerieName = (alias: string): string => {
  return startCase(alias)
}

export const formatRaceNotes = (raceNotes?: string): string | null => {
  if (!raceNotes) return null

  let notes = raceNotes.trim()
  notes = notes.replace(/{-{(\/?(b|p|li|ul|strong))}-}/g, '<$1>')
  notes = notes.replace(/{-{ul class="(.+)"}-}/g, '<ul>')

  return notes
}

export const getEventDiscipline = (eventBundle: CrossMgrEventBundle, eventName: string): 'ROAD' | 'CX' => {
  if (eventBundle.organizer.includes('LMCX') || eventName.toLowerCase().includes('cross')) return 'CX'

  return 'ROAD'
}