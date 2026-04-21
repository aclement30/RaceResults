import { z } from 'zod'
import { BaseCategorySchema } from './events.ts'

export const SerieSchema = z.object({
  hash: z.string(),
  alias: z.string(),
  name: z.string(),
  year: z.number(),
  organizerAlias: z.string(),
  types: z.array(z.enum(['individual', 'team'])),
  source: z.enum(['ingest', 'manual']),
  provider: z.string().optional(),
  userLocked: z.boolean().optional(),
  createdAt: z.string(),
  createdBy: z.string(),
  updatedBy: z.string().nullable(),
  updatedAt: z.string().nullable(),
  standingsUpdatedAt: z.string().nullable().optional(),
  hasPublishedEvents: z.boolean().optional(),
})

export const UpdateSerieSchema = SerieSchema
.omit({
  source: true,
  userLocked: true,
  createdBy: true,
  updatedBy: true
})
.partial({
  createdAt: true,
  updatedAt: true,
})

export const CreateSerieSchema = UpdateSerieSchema
.omit({
  hash: true,
})

// Serie Standings

const BaseSerieEventCategorySchema = z.object({
  corrections: z.string().optional(),
  userLocked: z.boolean().optional(),
  createdAt: z.string().optional(),
  createdBy: z.string().optional(),
  updatedAt: z.string().nullable().optional(),
  updatedBy: z.string().nullable().optional(),
})

export const ParticipantSerieEventResultSchema = z.object({
  participantId: z.string(),
  uciId: z.string().optional(),
  firstName: z.string(),
  lastName: z.string(),
  bibNumber: z.number().optional(),
  team: z.string().optional(),
  points: z.number(),
})

export const TeamSerieEventResultSchema = z.object({
  team: z.string(),
  points: z.number(),
})

export const SerieIndividualEventCategorySchema = BaseSerieEventCategorySchema.extend({
  standings: z.array(ParticipantSerieEventResultSchema),
})

export const SerieTeamEventCategorySchema = BaseSerieEventCategorySchema.extend({
  standings: z.array(TeamSerieEventResultSchema),
})

export const BaseSerieEventSchema = z.object({
  date: z.string().nullable(),
  published: z.boolean(),
})

export const SerieIndividualEventSchema = BaseSerieEventSchema.extend({
  categories: z.record(z.string(), SerieIndividualEventCategorySchema),
})

export const SerieTeamEventSchema = BaseSerieEventSchema.extend({
  combinedPoints: z.boolean().optional(), // Indicates if this event is a total/overall category for the team standings
  categories: z.record(z.string(), SerieTeamEventCategorySchema),
})

export const SerieStandingsSchema = z.object({
  hash: z.string(),
  categories: z.array(BaseCategorySchema),
  individual: z.object({
    events: z.array(SerieIndividualEventSchema),
    sourceUrls: z.array(z.string()),
  }).optional(),
  team: z.object({
    events: z.array(SerieTeamEventSchema),
    sourceUrls: z.array(z.string()),
  }).optional(),
})

// ── Snapshot ─────────────────────────────────────────────────────────────────

export const SerieResultsSnapshotSchema = z.object({
  hash: z.string(),
  previousIndividualEvents: z.array(SerieIndividualEventSchema).optional(),
  previousTeamEvents: z.array(SerieTeamEventSchema).optional(),
  createdAt: z.string(),
  createdBy: z.string(),
})
