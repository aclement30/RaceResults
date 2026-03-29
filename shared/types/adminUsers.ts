import { z } from 'zod'
import { AdminUserSchema } from '../schemas/adminUsers.ts'

export type AdminUser = z.infer<typeof AdminUserSchema>
