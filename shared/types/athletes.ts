import { z } from 'zod'
import {
  AthleteManualEditSchema, AthleteProfileSchema, AthleteRaceSchema,
  AthleteSchema,
  AthleteUpgradePointSchema,
  BaseAthleteSchema,
  BaseAthleteUpgradePointSchema,
  UpdateAthleteManualEditSchema,
  UpdateAthleteSchema
} from '../schemas/athletes.ts'
import type { TDiscipline } from './events'

const Gender = {
  'M': 'M',
  'F': 'F',
  'X': 'X',
} as const

export type TGender = typeof Gender[keyof typeof Gender]

export type Athlete = z.infer<typeof AthleteSchema>
export type BaseAthlete = z.infer<typeof BaseAthleteSchema>
export type AthleteManualEdit = z.infer<typeof AthleteManualEditSchema>
export type UpdateAthleteManualEdit = z.infer<typeof UpdateAthleteManualEditSchema>
export type UpdateAthlete = z.infer<typeof UpdateAthleteSchema>

export type AthleteProfile = z.infer<typeof AthleteProfileSchema>
export type AthleteRace = z.infer<typeof AthleteRaceSchema>
export type AthleteUpgradePoint = z.infer<typeof AthleteUpgradePointSchema>
export type BaseAthleteUpgradePoint = z.infer<typeof BaseAthleteUpgradePointSchema>

export type RecentlyUpgradedAthletes = Array<{
  athleteUciId: string,
  skillLevel: string,
  discipline: TDiscipline
  date: string,
}>