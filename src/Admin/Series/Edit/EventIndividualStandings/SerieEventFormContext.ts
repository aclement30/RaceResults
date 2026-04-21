import type { UseFormReturnType } from '@mantine/form'
import type { MutableRefObject } from 'react'
import { createContext } from 'react'
import type { ParticipantSerieEventResult } from '../../../../../shared/types'

export type SerieEventFormValues = {
  standings: ParticipantSerieEventResult[]
  corrections?: string
}

export type SerieEventFormType = UseFormReturnType<SerieEventFormValues>
export const SerieEventFormContext = createContext<MutableRefObject<SerieEventFormType> | null>(null)
