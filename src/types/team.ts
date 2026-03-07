export type Team = {
  id: number
  name: string
  city: string
  website?: string
  alternateNames?: string[]
  uniqueKeywords?: string[]
  deleted?: boolean
}

export type TeamRoster = {
  teamId: number
  athletes: {
    athleteUciId: string
    lastUpdated: string
    source?: 'manual' // Only present for manual changes
  }[]
}