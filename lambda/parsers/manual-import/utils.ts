import { validateYear } from '../shared/utils.ts'
import type { ManualImportCategory } from './types.ts'
import _ from 'lodash'

export const validateRefFile = (data: any): boolean => {
  if (!data.organizer?.length) throw new Error('Missing reference field: organizer')
  if (!data.name?.length) throw new Error('Missing reference field: name')
  if (!data.year || !validateYear(data.year)) throw new Error('Missing/invalid reference field: year')

  if (!data.type || !['event', 'series'].includes(data.type)) throw new Error('Missing/invalid reference field: type')
  if (!data.lastUpdated) throw new Error('Missing reference field: lastUpdated')
  if (!data.fields || Object.keys(data.fields).length === 0) throw new Error('Missing/invalid reference field: fields')
  if (data.type === 'event') {
    if (!data.categories || !data.categories.length) throw new Error('Missing/invalid reference field: categories')

    data.categories.forEach((category: ManualImportCategory, index: number) => {
      if (!category.inputLabel?.length) throw new Error(`Missing reference field: categories.${index}.inputLabel`)
      if (!category.outputLabel?.length) throw new Error(`Missing reference field: categories.${index}.outputLabel`)
      if (!category.filename?.length) throw new Error(`Missing reference field: categories.${index}.filename`)
    })
  } else if (data.type === 'series') {
    if (!data.categories || !Object.keys(data.categories).length) throw new Error('Missing/invalid reference field: categories')

    Object.keys(data.categories).forEach((key) => {
      if (!['individual', 'team'].includes(key)) throw new Error(`Invalid reference field: categories.${key}`)

      data.categories[key].forEach((category: ManualImportCategory, index: number) => {
        if (!category.inputLabel?.length) throw new Error(`Missing reference field: categories.${key}.${index}.inputLabel`)
        if (!category.outputLabel?.length) throw new Error(`Missing reference field: categories.${key}.${index}.outputLabel`)
        if (!category.filename?.length) throw new Error(`Missing reference field: categories.${key}.${index}.filename`)
      })
    })
  }

  return true
}

export const transformOrganizer = (organizerAlias: string): { organizerAlias: string, organizerName: string } => {
  if (organizerAlias === 'VictoriaCycling') {
    return {
      organizerAlias: 'VictoriaCycling',
      organizerName: 'Victoria Cycling League',
    }
  }

  return {
    organizerAlias,
    organizerName: _.startCase(organizerAlias),
  }
}

export const formatDurationToSeconds = (duration: string): number => {
  if (duration.match(/^\d+:\d+:\d+$/)) {
    const [hours, minutes, seconds] = duration.split(':').map(Number)
    return ( hours * 3600 ) + ( minutes * 60 ) + seconds
  } else if (duration.match(/^\d+:\d+$/)) {
    const [minutes, seconds] = duration.split(':').map(Number)
    return ( minutes * 60 ) + seconds
  } else if (duration.match(/^\dh\d+'\d+"$/)) {
    const [hours, minutes, seconds] = duration.split(/h|'|"/).map(s => s.trim())
    return ( +hours * 3600 ) + ( +minutes * 60 ) + ( +seconds )
  } else if (duration.match(/^\d+'\d+"$/)) {
    const [minutes, seconds] = duration.split('\'').map(s => s.trim().replace('"', ''))
    return ( +minutes * 60 ) + ( +seconds )
  } else if (duration.match(/^\d+"$/)) {
    const seconds = duration.replace('"', '').trim()
    return +seconds
  } else {
    throw new Error(`Invalid duration format: ${duration}`)
  }
}