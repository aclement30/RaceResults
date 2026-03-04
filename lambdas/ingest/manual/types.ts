export type ManualImportRawData = ManualImportBaseFile & {
  payloads: Record<string, string>
}

export type ManualImportBaseFile = {
  hash: string
  type: 'event' | 'serie'
  files?: string[]
  year: number
  organizer: string
  name: string
  location: {
    city: string
    province: string
    country: 'CA' | 'US'
  }
  provider?: string
  fields?: Record<string, string>
  lastUpdated: string
  sourceUrls?: string[]
}

export type ManualImportEventFile = ManualImportBaseFile & {
  type: 'event'
  date: string
  series?: string
  raceNotes?: string
  isTimeTrial?: boolean
  fields: Record<string, string>
  categories: ManualImportCategory[]
}

export type ManualImportSerieFile = ManualImportBaseFile & {
  type: 'serie'
  fields: Record<string, string>
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
  corrections?: string
}