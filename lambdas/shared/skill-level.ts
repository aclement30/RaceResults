import type { EventSummary } from '../../src/types/results'

// Extract athlete skill level (or skill group) from race
// Can be either a specific skill level (e.g. 1, 2, 3, etc.) or a skill range (e.g. elite -> [1, 2], 'cat 4/5' -> [4, 5], etc.)
export const extractAthleteSkillLevel = (
  category: string,
  eventSummary: Pick<EventSummary, 'name' | 'year'>
): {
  level?: number
  range?: [number, number],
  confidence: number
} => {
  const catAlias = category.toLowerCase().trim().replace(/-[mwx]$/, '')

  if (catAlias.match(/^cat-(\d)$/)) {
    const catNumber = +catAlias.match(/^cat-(\d)$/)?.[1]!
    if (ATHLETE_SKILL_CATEGORIES.includes(catNumber)) return { level: catNumber, confidence: 0.8 }
  } else if (catAlias.match(/^([mwx])-?(\d)$/)) {
    const catNumber = +catAlias.match(/^([mwx])-?(\d)$/)?.[2]!
    if (ATHLETE_SKILL_CATEGORIES.includes(catNumber)) return { level: catNumber, confidence: 0.8 }
  } else if (catAlias.match(/^(men|women|youth)-m?(\d)-\(/)) {
    const catNumber = +catAlias.match(/^(men|women|youth)-m?(\d)-\(/)?.[2]!
    if (ATHLETE_SKILL_CATEGORIES.includes(catNumber)) return { level: catNumber, confidence: 0.8 }
  } else if (eventSummary.name.includes('CONCORD') && eventSummary.year === 2024) {
    switch (catAlias) {
      case 'mpro':
        return { range: [1, 2], confidence: 0.7 }
      case 'mam':
        return { range: [3, 4], confidence: 0.7 }
      case 'wpro':
        return { range: [1, 3], confidence: 0.7 }
      case 'wam':
        return { range: [4, 5], confidence: 0.7 }
    }
  }

  // If no skill category is found, check for skill groups (e.g. 'elite', '1-2', '1-2-3', etc.)
  if (catAlias.match(/^cat-(\d[\/-]\d([\/-]\d)?)$/)) {
    const skillRangeString = catAlias.match(/^cat-(\d[\/-]\d([\/-]\d)?)$/)?.[1]!.replace(/\//g, '-')!
    if (ATHLETE_SKILL_RANGES[skillRangeString]) return {
      range: ATHLETE_SKILL_RANGES[skillRangeString],
      confidence: 0.7
    }
  } else if (catAlias.match(/^[mwx]-?(\d[\/-]\d([\/-]\d)?)$/)) {
    const skillRangeString = catAlias.match(/^[mwx]-?(\d[\/-]\d([\/-]\d)?)$/)?.[1]!.replace(/\//g, '-')!
    if (ATHLETE_SKILL_RANGES[skillRangeString]) return {
      range: ATHLETE_SKILL_RANGES[skillRangeString],
      confidence: 0.7
    }
  } else if (catAlias.match(/^elite-(\d[\/-]\d([\/-]\d)?)$/)) {
    const skillRangeString = catAlias.match(/^elite-(\d[\/-]\d([\/-]\d)?)$/)?.[1]!.replace(/\//g, '-')!
    if (ATHLETE_SKILL_RANGES[skillRangeString]) return {
      range: ATHLETE_SKILL_RANGES[skillRangeString],
      confidence: 0.7
    }
  } else if (catAlias.match(/^elite/)) {
    return { range: ATHLETE_SKILL_RANGES['elite'], confidence: 0.7 }
  } else if (catAlias.match(/^(men|women|youth)-m?(\d[\/-]\d([\/-]\d)?)-\(/)) {
    const skillRangeString = catAlias.match(/^(men|women|youth)-m?(\d[\/-]\d([\/-]\d)?)-\(/)?.[2]!
    if (ATHLETE_SKILL_RANGES[skillRangeString]) return {
      range: ATHLETE_SKILL_RANGES[skillRangeString],
      confidence: 0.7
    }
  }

  return { confidence: 0 }
}

const ATHLETE_SKILL_CATEGORIES = [1, 2, 3, 4, 5]

const ATHLETE_SKILL_RANGES: Record<string, [number, number]> = {
  'elite': [1, 2],
  '1-2': [1, 2],
  '1-2-3': [1, 3],
  '2-3': [2, 3],
  '2-3-4': [2, 4],
  '3-4': [3, 4],
  '3-4-5': [3, 5],
  '4-5': [4, 5],
}
