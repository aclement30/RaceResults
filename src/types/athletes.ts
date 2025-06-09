export type Athlete = {
  uciId: string
  firstName: string | null
  lastName: string | null
  gender: 'M' | 'F' | 'X'
  city: string | null
  province: string | null
  nationality: string | null
  birthYear: number
  licenses: Record<string, string[]>
  teams: Record<string, string[]>
  lastUpdated: string
}