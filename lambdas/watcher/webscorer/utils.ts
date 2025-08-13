import type { EventSummary } from '../../../src/types/results.ts'
import { transformCategory as defaultTransformCategory } from '../../shared/utils.ts'

export const getEventDiscipline = (sport: string): 'ROAD' | 'CX' => {
  if (sport === 'Cycling - road') {
    return 'ROAD'
  } else if (sport === 'Cycling - mtn cross-country') {
    return 'CX'
  }

  throw new Error(`Unsupported sport: ${sport}`)
}

export const getIgnoredCategories = (event: Pick<EventSummary, 'serie'>): string[] => {
  if (event.serie === 'VCL2025') {
    return [
      'overall',
      'male-overall',
      'female-overall',
      'a-male-overall',
      'a-female-overall',
      'b-male-overall',
      'b-female-overall',
      'c-overall',
      'c-male-overall',
      'c-female-overall',
      'd-overall',
      'd-male-overall',
      'd-female-overall',
    ]
  }

  return []
}

export const transformCategory = (
  catName: string,
  eventSummary: Pick<EventSummary, 'hash' | 'serie'>
): string => {
  if (eventSummary.serie === 'VCL2025') {
    switch (catName.toLowerCase()) {
      case 'male - a group - men':
        return 'A Male - Adult'
      case 'male - a group - youth boys':
        return 'A Male - U19'
      case 'female - a group - women':
        return 'A Female - Adult'
      case 'female - a group - youth girls':
        return 'A Female - U19'
      case 'male - b group - men':
        return 'B Male - Adult'
      case 'male - b group - youth boys':
        return 'B Male - U19'
      case 'female - b group - women':
        return 'B Female - Adult'
      case 'female - b group - youth girls':
        return 'B Female - U19'
      case 'male - c group - men':
        return 'C Male - Adult'
      case 'male - c group - youth boys':
        return 'C Male - U19'
      case 'female - c group - women':
        return 'C Female - Adult'
      case 'female - c group - youth girls':
        return 'C Female - U19'
      case 'male - d group - men':
        return 'D Male - Adult'
      case 'male - d group - youth boys':
        return 'D Male - U19'
      case 'female - d group - women':
        return 'D Female - Adult'
      case 'female - d group - youth girls':
        return 'D Female - U19'
    }
  }

  return defaultTransformCategory(catName)
}