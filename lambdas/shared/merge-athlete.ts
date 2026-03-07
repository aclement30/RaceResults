import { omit } from 'lodash-es'
import type { Athlete, AthleteManualEdit } from './types.ts'

const OBJECT_FIELDS = ['licenses', 'teams', 'skillLevel', 'ageCategory', 'latestUpgrade'] as (keyof Athlete)[]

export const mergeAthleteChanges = (base: Partial<Athlete>, changes: Partial<Athlete>): Partial<Athlete> => {
  const merged = {
    ...base,
    ...omit(changes, [
      // These fields should not be overridden by changes
      'uciId',
      'lastUpdated',
      'meta',
      // These fields are objects that require merging rather than replacement
      ...OBJECT_FIELDS,
    ]),
  }

  // Merge object attributes
  OBJECT_FIELDS.forEach((field) => {
    if (changes[field]) {
      // @ts-ignore
      merged[field] = {
        // @ts-ignore
        ...(base[field] || {}),  // Preserve existing keys from base
        // @ts-ignore
        ...(changes[field] || {})    // Override/add keys from changes
      }
    }
  })

  return merged
}

// Calculate the required manual edits to transform baseAthlete into targetAthlete, only including fields that differ from baseAthlete
export const calculateRequiredManualEdits = (
  baseAthlete: Athlete,
  targetAthlete: Athlete
): Omit<AthleteManualEdit, 'meta'> => {
  const manualEdits: Omit<AthleteManualEdit, 'meta'> = { uciId: baseAthlete.uciId }

  ;(Object.keys(targetAthlete) as (keyof Athlete)[]).forEach((key) => {
    if (key === 'uciId') return // Skip uciId

    const fieldKey = key as keyof Athlete
    const baseValue = baseAthlete[fieldKey]
    const targetValue = targetAthlete[fieldKey]

    if (OBJECT_FIELDS.includes(key)) {
      // For object fields, only store the keys that differ from base
      const baseObject = baseValue || {}
      const targetObject = targetValue || {}
      const diffObject: any = {}

      // Find keys in target that are different from base
      Object.keys(targetObject).forEach(subKey => {
        // @ts-ignore
        if (JSON.stringify(targetObject[subKey]) !== JSON.stringify(baseObject[subKey])) {
          // @ts-ignore
          diffObject[subKey] = targetObject[subKey]
        }
      })

      // Only store if there are actual differences
      if (Object.keys(diffObject).length > 0) {
        // @ts-ignore
        manualEdits[fieldKey] = diffObject
      }
    } else {
      // For primitive fields, store if different from base
      if (JSON.stringify(targetValue) !== JSON.stringify(baseValue)) {
        // @ts-ignore
        manualEdits[fieldKey] = targetValue
      }
    }
  })

  return manualEdits
}