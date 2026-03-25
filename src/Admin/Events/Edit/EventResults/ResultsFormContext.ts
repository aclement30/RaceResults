import { createContext } from 'react'
import type { MutableRefObject } from 'react'
import type { UseFormReturnType } from '@mantine/form'
import type { ParticipantResult, PrimeResult } from '../../../../../shared/types'

export type ResultsFormValues = {
  results: ParticipantResult[]
  primes: PrimeResult[]
  startTime: number | null
  starters: number
  finishers: number
  laps: number | null
  lapDistanceKm: number | null
  raceDistanceKm: number | null
  corrections: string
}
export type ResultsFormType = UseFormReturnType<ResultsFormValues>
export const ResultsFormContext = createContext<MutableRefObject<ResultsFormType> | null>(null)
