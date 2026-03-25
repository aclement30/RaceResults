import { z } from 'zod'
import { BC_SANCTIONED_EVENT_TYPES, RACE_TYPES } from '../../src/config/event-types.ts'
import {
  BaseCategorySchema,
  CreateEventCategorySchema,
  CreateEventResultsSchema,
  CreateEventSchema,
  EventCategorySchema,
  EventResultsSchema,
  EventResultsSnapshotSchema,
  ParticipantResultSchema,
  PrimeResultSchema,
  RaceEventSchema,
  type TParticipantStatus,
  UpdateEventSchema,
  UpgradePointResultSchema,
} from '../schemas/events.ts'

export type RaceEvent = z.infer<typeof RaceEventSchema>
export type CreateEvent = z.infer<typeof CreateEventSchema>
export type UpdateEvent = z.infer<typeof UpdateEventSchema>

export type BaseCategory = z.infer<typeof BaseCategorySchema>
export type EventResults = z.infer<typeof EventResultsSchema>
export type EventCategory = z.infer<typeof EventCategorySchema>
export type ParticipantResult = z.infer<typeof ParticipantResultSchema>
export type UpgradePointResult = z.infer<typeof UpgradePointResultSchema>
export type PrimeResult = z.infer<typeof PrimeResultSchema>

export type CreateEventResults = z.infer<typeof CreateEventResultsSchema>
export type EventResultsSnapshot = z.infer<typeof EventResultsSnapshotSchema>
// export type CreateEventResults = z.infer<typeof CreateEventResultsSchema>
export type CreateEventCategory = z.infer<typeof CreateEventCategorySchema>

const Discipline = {
  'ROAD': 'ROAD',
  'CX': 'CX',
} as const
export type TDiscipline = typeof Discipline[keyof typeof Discipline]
export type { TParticipantStatus }
export type SanctionedEventType = keyof typeof BC_SANCTIONED_EVENT_TYPES
export type RaceType = keyof typeof RACE_TYPES

