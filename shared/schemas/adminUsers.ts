import z from 'zod'

export const AdminUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
})