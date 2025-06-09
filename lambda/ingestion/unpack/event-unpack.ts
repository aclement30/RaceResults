import type {
  EventResults,
  EventSummary
} from '../../../src/types/results.ts'
import type { CleanAthleteRaceResult, CleanEventWithResults } from '../shared/types.ts'
import { getBaseCategories } from '../shared/utils.ts'

export const unpackEvent = (event: CleanEventWithResults): { summary: EventSummary, results: EventResults } => {
  const categories = getBaseCategories(event.results)

  const summary: EventSummary = {
    hash: event.hash,
    name: event.name,
    date: event.date,
    year: event.year,
    type: 'event',
    organizerAlias: event.organizerAlias,
    organizerOrg: event.organizerOrg,
    organizerName: event.organizerName,
    organizerEmail: event.organizerEmail,
    serie: event.serie,
    isTimeTrial: event.isTimeTrial,
    sanctionedEventType: event.sanctionedEventType,
    hasUpgradePoints: event.hasUpgradePoints,
    isDoubleUpgradePoints: event.isDoubleUpgradePoints,
    provider: event.provider,
    categories,
  }

  const results: EventResults = {
    hash: event.hash,
    athletes: shapeAthletes(event.athletes),
    results: shapeCategoriesResults(event.results),
    sourceUrls: event.sourceUrls,
    raceNotes: event.raceNotes,
    lastUpdated: event.lastUpdated,
  }

  return {
    summary,
    results,
  }
}

export const shapeAthletes = (athletes: CleanEventWithResults['athletes']): EventResults['athletes'] => {
  return Object.keys(athletes).reduce((updatedAthletes, key) => {
    const athlete = athletes[key]

    updatedAthletes[key] = {
      bibNumber: athlete.bibNumber,
      firstName: athlete.firstName,
      lastName: athlete.lastName,
      city: athlete.city,
      province: athlete.province,
      uciId: athlete.uciId,
      team: athlete.team,
    }

    return updatedAthletes
  }, {} as EventResults['athletes'])
}

export const shapeCategoriesResults = (results: CleanEventWithResults['results']): EventResults['results'] => {
  return Object.keys(results).reduce((updatedResults, key) => {
    const category = results[key]

    let lapGapsByBib: Record<string, Array<number | null>> = {}

    if (category.laps && category.laps > 1) {
      lapGapsByBib = calculateLapGaps(category.results as CleanAthleteRaceResult[], category.laps)
    }

    updatedResults[key] = {
      ...category,
      results: category.results.map((result: CleanAthleteRaceResult) => ({
        position: result.position,
        bibNumber: result.bibNumber,
        finishTime: result.finishTime,
        finishGap: result.finishGap,
        avgSpeed: result.avgSpeed,
        status: result.status,
        relegated: result.relegated,
        lapSpeeds: result.lapSpeeds,
        lapDurations: result.lapDurations,
        lapGaps: lapGapsByBib[result.bibNumber] || null,
        upgradePoints: result.upgradePoints ?? null,
      })),
    }

    return updatedResults
  }, {} as EventResults['results'])
}

export const calculateLapGaps = (results: CleanAthleteRaceResult[], lapCount: number): Record<string, Array<number | null>> => {
  const lapGaps: Record<string, Array<number | null>> = {}

  for (let i = 1; i < lapCount + 1; i++) {
    const firstRiderPastTheLine = results.reduce((prev, curr) => !curr.lapTimes![i] || prev.lapTimes![i] < curr.lapTimes![i] ? prev : curr)

    results.forEach(({ bibNumber, lapTimes }) => {
      const riderGapInCurrentLap = lapTimes![i] ? lapTimes![i] - firstRiderPastTheLine.lapTimes![i] : null

      if (!lapGaps.hasOwnProperty(bibNumber)) lapGaps[bibNumber] = []
      lapGaps[bibNumber].push(riderGapInCurrentLap)
    })
  }

  return lapGaps
}