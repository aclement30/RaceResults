import { z } from 'zod'
import { ParticipantResultSchema, RaceEventSchema } from './events'

export const BaseAthleteSchema = z.object({
  uciId: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  gender: z.enum(['M', 'F', 'X']).optional(),
  city: z.string().nullable().optional(),
  province: z.string().nullable().optional(),
  nationality: z.string().nullable().optional(),
  birthYear: z.number().nullable().optional(),
  licenses: z.record(z.string(), z.array(z.string())),
  skillLevel: z.object({
    ROAD: z.string().nullable().optional(),
    CX: z.string().nullable().optional(),
  }).optional(),
  ageCategory: z.object({
    ROAD: z.string().nullable().optional(),
    CX: z.string().nullable().optional(),
  }).optional(),
  latestUpgrade: z.object({
    ROAD: z.object({
      date: z.string().nullable(),
      confidence: z.number(),
    }).optional(),
    CX: z.object({
      date: z.string().nullable(),
      confidence: z.number(),
    }).optional(),
  }).optional(),
  lastUpdated: z.string(),
})

export const AthleteSchema = BaseAthleteSchema.extend({
  teams: z.record(
    z.string(),
    z.object({
      id: z.number().optional(),
      name: z.string().optional(),
    }).nullable()
  ),
})

export const UpdateAthleteSchema = AthleteSchema
.omit({
  uciId: true,
  lastUpdated: true,
})
.partial()

export const AthleteManualEditSchema = BaseAthleteSchema
.partial()
.extend({
  uciId: z.string(),
  meta: z.object({
    createdAt: z.string(),
    createdBy: z.string().optional(),
    updatedAt: z.string(),
    updatedBy: z.string().optional(),
  })
})

export const UpdateAthleteManualEditSchema = AthleteManualEditSchema.partial({
  meta: true
})

export const AthleteRaceSchema = z.object({
  position: ParticipantResultSchema.shape.position,
  status: ParticipantResultSchema.shape.status,
  date: z.string(),
  eventHash: z.string(),
  eventName: z.string(),
  eventType: RaceEventSchema.shape.sanctionedEventType.nullable(),
  discipline: z.string(),
  categoryAlias: z.string(),
  categoryLabel: z.string(),
})

export const BaseAthleteUpgradePointSchema = z.object({
  athleteUciId: z.string(),
  date: z.string(),
  eventHash: z.string(),
  eventType: RaceEventSchema.shape.sanctionedEventType.nullable(),
  discipline: RaceEventSchema.shape.discipline,
  position: z.number(),
  categoryAlias: z.string(),
  categoryLabel: z.string(),
  points: z.number(),
  fieldSize: z.number(),
  type: z.enum(['UPGRADE', 'SUBJECTIVE']),
  partialMatch: z.boolean().optional(),
})

export const AthleteUpgradePointSchema = BaseAthleteUpgradePointSchema
.omit({ athleteUciId: true })
.extend({
  eventName: z.string(),
  categoryLabel: z.string(),
})

export const AthleteProfileSchema = z.object({
  uciId: z.string(),
  upgradePoints: z.array(AthleteUpgradePointSchema).optional(),
  races: z.array(AthleteRaceSchema).optional(),
})