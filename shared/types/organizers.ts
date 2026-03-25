import { z } from 'zod'
import { OrganizerSchema } from '../schemas/organizers.ts'

export type Organizer = z.infer<typeof OrganizerSchema>