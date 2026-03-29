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
  published: z.boolean(),
  userLocked: z.boolean().optional(),
  createdAt: z.string(),
  createdBy: z.string(),
  updatedBy: z.string().nullable(),
  updatedAt: z.string().nullable(),
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

export const ParticipantSerieResultSchema = z.object({
  participantId: z.string(),
  position: z.number(),
  bibNumber: z.number().optional(),
  firstName: z.string(),
  lastName: z.string(),
  uciId: z.string().optional(),
  team: z.string().optional(),
  totalPoints: z.number(),
  racePoints: z.record(z.string(), z.number()),
})

export const TeamSerieResultSchema = z.object({
  position: z.number(),
  team: z.string(),
  totalPoints: z.number(),
  racePoints: z.record(z.string(), z.number()).optional(),
})

export const SerieIndividualCategorySchema = BaseCategorySchema.extend({
  results: z.array(ParticipantSerieResultSchema),
  corrections: z.string().optional(),
  createdAt: z.string(),
  createdBy: z.string(),
  updatedAt: z.string().nullable(),
  updatedBy: z.string().nullable(),
})

export const CreateSerieIndividualCategorySchema = SerieIndividualCategorySchema
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

export const SerieTeamCategorySchema = BaseCategorySchema.extend({
  results: z.array(TeamSerieResultSchema),
  corrections: z.string().optional(),
  createdAt: z.string(),
  createdBy: z.string(),
  updatedAt: z.string().nullable(),
  updatedBy: z.string().nullable(),
})

export const CreateSerieTeamCategorySchema = SerieTeamCategorySchema
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

// Serie Results
export const SerieResultsSchema = z.object({
  hash: z.string(),
  individual: z.object({
    categories: z.array(SerieIndividualCategorySchema),
    sourceUrls: z.array(z.string()),
  }).optional(),
  team: z.object({
    categories: z.array(SerieTeamCategorySchema),
    sourceUrls: z.array(z.string()),
  }).optional(),
})

export const CreateSerieResultsSchema = SerieResultsSchema.extend({
  individual: z.object({
    categories: z.array(CreateSerieIndividualCategorySchema),
    sourceUrls: z.array(z.string()),
  }).optional(),
  team: z.object({
    categories: z.array(CreateSerieTeamCategorySchema),
    sourceUrls: z.array(z.string()),
  }).optional(),
})

export const SerieResultsSnapshotSchema = z.object({
  hash: z.string(),
  // Only categories which have changed from the current version
  individualCategories: z.array(SerieIndividualCategorySchema.omit({
    // Omit metadata fields
    createdAt: true,
    createdBy: true,
    updatedAt: true,
    updatedBy: true,
    userLocked: true,
  })).optional(),
  // Only categories which have changed from the current version
  teamCategories: z.array(SerieTeamCategorySchema.omit({
    // Omit metadata fields
    createdAt: true,
    createdBy: true,
    updatedAt: true,
    updatedBy: true,
    userLocked: true,
  })).optional(),
  createdAt: z.string(),
  createdBy: z.string(),
})