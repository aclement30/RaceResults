import { z } from 'zod'
import {
  BaseSerieEventSchema,
  CreateSerieSchema,
  ParticipantSerieEventResultSchema,
  SerieIndividualEventCategorySchema,
  SerieIndividualEventSchema,
  SerieResultsSnapshotSchema,
  SerieSchema,
  SerieStandingsSchema,
  SerieTeamEventSchema,
  TeamSerieEventResultSchema,
  UpdateSerieSchema
} from '../schemas/series.ts'

export type Serie = z.infer<typeof SerieSchema>
export type SerieStandings = z.infer<typeof SerieStandingsSchema>
export type ParticipantSerieEventResult = z.infer<typeof ParticipantSerieEventResultSchema>
export type TeamSerieEventResult = z.infer<typeof TeamSerieEventResultSchema>
export type SerieIndividualEventCategory = z.infer<typeof SerieIndividualEventCategorySchema>
export type SerieIndividualEvent = z.infer<typeof SerieIndividualEventSchema>
export type SerieTeamEvent = z.infer<typeof SerieTeamEventSchema>
export type BaseSerieEvent = z.infer<typeof BaseSerieEventSchema>

export type CreateSerie = z.infer<typeof CreateSerieSchema>

export type UpdateSerie = z.infer<typeof UpdateSerieSchema>
export type SerieResultsSnapshot = z.infer<typeof SerieResultsSnapshotSchema>