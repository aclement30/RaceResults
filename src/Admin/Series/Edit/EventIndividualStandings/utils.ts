import type { ParticipantResult, ParticipantSerieEventResult, PrimeResult } from '../../../../../shared/types'
import type { SortColumn } from './EventIndividualStandings'

const findFinishPosition = (
  result: ParticipantSerieEventResult,
  raceResults: ParticipantResult[],
): number | undefined => {
  const match = result.uciId
    ? raceResults.find(r => r.uciId === result.uciId)
    : raceResults.find(r => r.firstName === result.firstName && r.lastName === result.lastName)
  return match?.position || undefined
}

const findPrimePosition = (
  result: ParticipantSerieEventResult,
  raceResults: ParticipantResult[],
  racePrimes: PrimeResult[],
): number | undefined => {
  const raceResult = result.uciId
    ? raceResults.find(r => r.uciId === result.uciId)
    : raceResults.find(r => r.firstName === result.firstName && r.lastName === result.lastName)
  if (!raceResult) return undefined
  return racePrimes.find(prime => prime.participantId === raceResult.participantId)?.position
}

export const applySortToResults = (
  results: ParticipantSerieEventResult[],
  column: SortColumn,
  raceResults: ParticipantResult[],
  racePrimes: PrimeResult[],
): ParticipantSerieEventResult[] => {
  const sorted = [...results]
  if (column === 'points') {
    sorted.sort((a, b) => b.points - a.points)
  } else if (column === 'finishPosition') {
    sorted.sort((a, b) => {
      const positionA = findFinishPosition(a, raceResults) ?? Infinity
      const positionB = findFinishPosition(b, raceResults) ?? Infinity
      return positionA - positionB
    })
  } else {
    sorted.sort((a, b) => {
      const primePositionA = findPrimePosition(a, raceResults, racePrimes) ?? Infinity
      const primePositionB = findPrimePosition(b, raceResults, racePrimes) ?? Infinity
      return primePositionA - primePositionB
    })
  }
  return sorted
}