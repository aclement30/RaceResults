import { z } from 'zod'
import {
  CreateSerieIndividualCategorySchema,
  CreateSerieResultsSchema,
  CreateSerieSchema,
  CreateSerieTeamCategorySchema,
  ParticipantSerieResultSchema,
  SerieIndividualCategorySchema,
  SerieResultsSchema,
  SerieResultsSnapshotSchema,
  SerieSchema,
  SerieTeamCategorySchema,
  TeamSerieResultSchema,
  UpdateSerieSchema
} from '../schemas/series.ts'

export type Serie = z.infer<typeof SerieSchema>
export type SerieResults = z.infer<typeof SerieResultsSchema>
export type ParticipantSerieResult = z.infer<typeof ParticipantSerieResultSchema>
export type TeamSerieResult = z.infer<typeof TeamSerieResultSchema>
export type SerieIndividualCategory = z.infer<typeof SerieIndividualCategorySchema>
export type SerieTeamCategory = z.infer<typeof SerieTeamCategorySchema>

export type CreateSerie = z.infer<typeof CreateSerieSchema>
export type CreateSerieIndividualCategory = z.infer<typeof CreateSerieIndividualCategorySchema>
export type CreateSerieTeamCategory = z.infer<typeof CreateSerieTeamCategorySchema>
export type CreateSerieResults = z.infer<typeof CreateSerieResultsSchema>

export type UpdateSerie = z.infer<typeof UpdateSerieSchema>
export type SerieResultsSnapshot = z.infer<typeof SerieResultsSnapshotSchema>