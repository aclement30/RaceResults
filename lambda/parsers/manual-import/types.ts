export type ManualImportBaseFile = {
  hash: string
  type: 'event' | 'series'
  files?: string[]
  year: number
  organizer: string
  name: string
  fields: Record<string, string>
  lastUpdated: string
  sourceUrls?: string[]
}

export type ManualImportEventFile = ManualImportBaseFile & {
  type: 'event'
  date: string
  series?: string
  raceNotes?: string
  isTimeTrial?: boolean
  categories: ManualImportCategory[]
}

export type ManualImportSerieFile = ManualImportBaseFile & {
  type: 'series'
  categories: {
    individual?: ManualImportCategory[]
    team?: ManualImportCategory[]
  }
}

export type ManualImportCategory = {
  inputLabel: string
  outputLabel: string
  filename: string
  distance?: number
}
