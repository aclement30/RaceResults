export type RawAthleteLicense = {
  year: number
  text: string
  discipline: string
  ageCategory?: string
  ageGroup?: string
  level: string
}

export type RawAthleteMembershipData = {
  uciId: string
  firstName: string
  lastName: string
  licenses: RawAthleteLicense[]
}