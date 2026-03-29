import { z } from 'zod'

export const TeamSchema = z.object({
  id: z.number(),
  name: z.string(),
  city: z.string(),
  website: z.string().optional(),
  alternateNames: z.array(z.string()).optional(),
  uniqueKeywords: z.array(z.string()).optional(),
  deleted: z.boolean().optional(),
})

export const CreateTeamSchema = TeamSchema.omit({
  id: true,
  deleted: true,
})

export const TeamRosterSchema = z.object({
  teamId: z.number(),
  athletes: z.array(
    z.object({
      athleteUciId: z.string(),
      lastUpdated: z.string(),
      source: z.literal('manual').optional(),
    })
  ),
})