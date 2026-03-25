import { z } from 'zod'
import { CreateTeamSchema, TeamRosterSchema, TeamSchema } from '../schemas/teams.ts'

export type Team = z.infer<typeof TeamSchema>
export type CreateTeam = z.infer<typeof CreateTeamSchema>
export type TeamRoster = z.infer<typeof TeamRosterSchema>