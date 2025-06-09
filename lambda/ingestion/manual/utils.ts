import _ from 'lodash'
import { s3 as RRS3, sortByCategory as defautSortByCategory, validateYear } from '../shared/utils.ts'
import type { ManualImportCategory } from './types.ts'
import { RAW_DATA_PATH } from './config.ts'

export const listRefFiles = async (year: number): Promise<string[]> => {
  const { files } = await RRS3.fetchDirectoryFiles(RAW_DATA_PATH + year + '/')

  const refFiles = files?.filter(file => file.Key!.endsWith('.json')).map(file => file.Key!.split('/').pop()!) || []

  return refFiles
}

export const validateRefFile = (data: any): boolean => {
  if (!data.organizer?.length) throw new Error('Missing reference field: organizer')
  if (!data.name?.length) throw new Error('Missing reference field: name')
  if (!data.year || !validateYear(data.year)) throw new Error('Missing/invalid reference field: year')

  if (!data.type || !['event', 'serie'].includes(data.type)) throw new Error('Missing/invalid reference field: type')
  if (!data.lastUpdated) throw new Error('Missing reference field: lastUpdated')
  if (!data.fields || Object.keys(data.fields).length === 0) throw new Error('Missing/invalid reference field: fields')
  if (data.type === 'event') {
    if (!data.categories || !data.categories.length) throw new Error('Missing/invalid reference field: categories')

    data.categories.forEach((category: ManualImportCategory, index: number) => {
      if (!category.inputLabel?.length) throw new Error(`Missing reference field: categories.${index}.inputLabel`)
      if (!category.outputLabel?.length) throw new Error(`Missing reference field: categories.${index}.outputLabel`)
      if (!category.filename?.length) throw new Error(`Missing reference field: categories.${index}.filename`)
    })
  } else if (data.type === 'serie') {
    if (!data.categories || !Object.keys(data.categories).length) throw new Error('Missing/invalid reference field: categories')

    Object.keys(data.categories).forEach((key) => {
      if (!['individual', 'team'].includes(key)) throw new Error(`Invalid reference field: categories.${key}`)

      data.categories[key].forEach((category: ManualImportCategory, index: number) => {
        if (!category.inputLabel?.length) throw new Error(`Missing reference field: categories.${key}.${index}.inputLabel`)
        if (!category.outputLabel?.length) throw new Error(`Missing reference field: categories.${key}.${index}.outputLabel`)
        if (!category.filename?.length) throw new Error(`Missing reference field: categories.${key}.${index}.filename`)
      })
    })
  } else {
    throw new Error(`Unsupported reference file type: ${data.type}`)
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
    return (hours * 3600) + (minutes * 60) + seconds
  } else if (duration.match(/^\d+:\d+$/)) {
    const [minutes, seconds] = duration.split(':').map(Number)
    return (minutes * 60) + seconds
  } else if (duration.match(/^\dh\d+['’]\d+"$/)) {
    const [hours, minutes, seconds] = duration.split(/h|'|’|"/).map(s => s.trim())
    return (+hours * 3600) + (+minutes * 60) + (+seconds)
  } else if (duration.match(/^\d+['’]\d+"$/)) {
    const [minutes, seconds] = duration.split(/'|’/).map(s => s.trim().replace('"', ''))
    return (+minutes * 60) + (+seconds)
  } else if (duration.match(/^\d+"$/)) {
    const seconds = duration.replace('"', '').trim()
    return +seconds
  } else {
    throw new Error(`Invalid duration format: ${duration}`)
  }
}

export const sortByCategory = (organizer: string) => {
  if (organizer === 'CRC') {
    const crcCatOrder = ['expert (m)', 'expert (w)', 'advanced (m)', 'advanced (w)', 'sport (m)', 'sport (w)', 'novice (m)', 'novice (w)']

    return (a: { label: string }, b: { label: string }): number => {
      const indexA = crcCatOrder.indexOf(a.label.toLowerCase())
      const indexB = crcCatOrder.indexOf(b.label.toLowerCase())

      if (indexA === -1 && indexB === -1) return 0
      if (indexA === -1) return 1
      if (indexB === -1) return -1

      return indexA - indexB
    }
  }

  return defautSortByCategory
}