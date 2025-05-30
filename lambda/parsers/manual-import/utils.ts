import { validateYear } from '../shared/utils.ts'

export const validateRefFile = (data: any): boolean => {
  if (!data.organizer?.length) throw new Error('Missing reference field: organizer')
  if (!data.name?.length) throw new Error('Missing reference field: name')
  if (!data.year || !validateYear(data.year)) throw new Error('Missing/invalid reference field: year')

  if (!data.type || !['event', 'series'].includes(data.type)) throw new Error('Missing/invalid reference field: type')
  if (!data.lastUpdated) throw new Error('Missing reference field: lastUpdated')
  if (!data.fields || Object.keys(data.fields).length === 0) throw new Error('Missing/invalid reference field: fields')
  if (data.type === 'series') {
    if (!data.categories || !Object.keys(data.categories).length) throw new Error('Missing/invalid reference field: categories')

    Object.keys(data.categories).forEach((key) => {
      if (!['individual', 'team'].includes(key)) throw new Error(`Invalid reference field: categories.${key}`)

      data.categories[key].forEach((category, index: number) => {
        if (!category.inputLabel?.length) throw new Error(`Missing reference field: categories.${key}.${index}.inputLabel`)
        if (!category.outputLabel?.length) throw new Error(`Missing reference field: categories.${key}.${index}.outputLabel`)
        if (!category.filename?.length) throw new Error(`Missing reference field: categories.${key}.${index}.filename`)
      })
    })
  }

  return true
}
