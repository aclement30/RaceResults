export type StoredEventSummary = {
  hash: string
  year: number
  date: string
  resultsFile: string
}

export type AthleteOverrides = {
  deactivatedUciIds?: string[]
  replacedUciIds?: Record<string, { old: string, new: string, name: string }>
}