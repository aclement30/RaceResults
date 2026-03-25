import { z } from 'zod'

// Base category schema
export const BaseCategorySchema = z.object({
  alias: z.string(), // Non-editable unique identifier for the category
  label: z.string(),
  gender: z.enum(['M', 'F', 'X']),
  // subCategories: z.array(z.string()).optional(),
  parentCategory: z.string().optional(),
  // Metadata
  createdAt: z.string().optional(),
  createdBy: z.string().optional(),
  updatedAt: z.string().nullable().optional(),
  updatedBy: z.string().nullable().optional(),
  userLocked: z.boolean().optional(),
})

export const PARTICIPANT_STATUSES = ['FINISHER', 'DNF', 'DNS', 'OTL', 'DQ', 'NP', 'TC'] as const
export type TParticipantStatus = typeof PARTICIPANT_STATUSES[number]

// Race Event
export const RaceEventSchema = z.object({
  hash: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  name: z.string(),
  discipline: z.enum(['ROAD', 'CX']),
  location: z.object({
    city: z.string(),
    province: z.string(),
    country: z.enum(['CA', 'US'])
  }),
  organizerAlias: z.string(),
  sanctionedEventType: z.enum(['GRASSROOTS', 'A', 'AA', 'AAA', 'AA-USA', 'MASS-PARTICIPATION']),
  raceType: z.enum(['CRIT', 'CIRCUIT', 'ROAD', 'TT']).nullable(),
  hasUpgradePoints: z.union([
    z.literal('UPGRADE'),
    z.literal('SUBJECTIVE'),
    z.literal(false)
  ]),
  isDoubleUpgradePoints: z.boolean(),
  serie: z.string().nullable(),
  sourceUrls: z.array(z.string()).default([]),
  raceNotes: z.string().optional(),
  // Metadata fields
  source: z.enum(['ingest', 'manual']),
  provider: z.string().optional(),
  published: z.boolean().default(true),
  userLocked: z.boolean().optional(),
  createdAt: z.string(),
  createdBy: z.string(),
  updatedBy: z.string().nullable(),
  updatedAt: z.string().nullable(),
})

export const UpdateEventSchema = RaceEventSchema
.omit({
  hasUpgradePoints: true,
  isDoubleUpgradePoints: true,
  source: true,
  userLocked: true,
  createdBy: true,
  updatedBy: true
})
.partial({
  createdAt: true,
  updatedAt: true,
})


export const CreateEventSchema = UpdateEventSchema
.omit({
  hash: true,
})

// Participant category result
export const ParticipantResultSchema = z.object({
  participantId: z.string(),
  bibNumber: z.number().optional(),
  // Demographic data
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  uciId: z.string().optional(),
  team: z.string().optional(),
  gender: z.enum(['M', 'F', 'X']).optional(),
  license: z.string().optional(),
  age: z.number().optional(),
  nationality: z.string().optional(),
  // Position
  position: z.number().nullable(),    // DNF/DNS/OTL might have null position
  status: z.enum(PARTICIPANT_STATUSES).nullable(),
  // Timing data
  finishTime: z.number().nullable(),  // DNS/OTL might have null finish time
  lapSpeeds: z.array(z.number()).optional(),
  lapDurations: z.array(z.number()).optional(),
  lapTimes: z.array(z.number()).optional(),
  lapGaps: z.array(z.number().nullable()).optional(),
  finishGap: z.number().optional(),
  avgSpeed: z.number().optional(),
  relegated: z.boolean().optional()
})

// Prime result schema
export const PrimeResultSchema = z.object({
  participantId: z.string(),
  number: z.number(),
  position: z.number(),
})

// Upgrade point result schema
export const UpgradePointResultSchema = z.object({
  participantId: z.string(),
  position: z.number(),
  points: z.number()
})

// Event category schema
export const EventCategorySchema = BaseCategorySchema.extend({
  results: z.array(ParticipantResultSchema),
  primes: z.array(PrimeResultSchema),
  upgradePoints: z.array(UpgradePointResultSchema).nullable(), // Combined participant upgrade points for the category. Umbrella categories will be null
  startTime: z.number().optional(),
  laps: z.number().optional(),
  fieldSize: z.number().optional(),                 // Combined categories field size (only calculated for categories with upgrade points)
  starters: z.number(),
  finishers: z.number(),
  corrections: z.string().optional(),
  // Distance
  lapDistanceKm: z.number().optional(),
  raceDistanceKm: z.number().optional(),
  // Metadata fields
  createdAt: z.string(),
  createdBy: z.string(),
  updatedAt: z.string().nullable(),
  updatedBy: z.string().nullable(),
})

// Event Results
export const EventResultsSchema = z.object({
  hash: z.string(),
  categories: z.array(EventCategorySchema),
})

export const CreateEventCategorySchema = EventCategorySchema
.omit({
  // Omit metadata fields
  createdBy: true,
  updatedBy: true,
})
.partial({
  createdAt: true,
  updatedAt: true,
  userLocked: true,
})

export const CreateEventResultsSchema = EventResultsSchema.extend({
  categories: z.array(CreateEventCategorySchema)
})

export const EventResultsSnapshotSchema = z.object({
  hash: z.string(),
  // Only categories which have changed from the current version
  categories: z.array(EventCategorySchema.omit({
    // Omit metadata fields
    createdAt: true,
    createdBy: true,
    updatedAt: true,
    updatedBy: true,
    userLocked: true,
  })),
  createdAt: z.string(),
  createdBy: z.string(),
})