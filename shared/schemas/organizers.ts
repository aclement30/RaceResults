import { z } from 'zod'

export const OrganizerSchema = z.object({
  alias: z.string(),
  displayName: z.string(),
  director: z.string().optional(),
  email: z.string().email().optional(),
})