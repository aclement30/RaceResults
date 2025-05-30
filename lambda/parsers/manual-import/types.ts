export type ManualImportEventSerieFile = {
  hash: string
  type: 'event' | 'series'
  files: string[]
  year: number
  organizer: string
  name: string
  fields: Record<string, string>
  lastUpdated: string
  categories: {
    individual?: ManualImportCategory[]
    team?: ManualImportCategory[]
  }
}

export type ManualImportCategory = {
  inputLabel: string
  outputLabel: string
  filename: string
}