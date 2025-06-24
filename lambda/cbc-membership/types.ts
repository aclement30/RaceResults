export type AthleteLicense = {
  year: number
  text: string
  discipline: string
  ageCategory?: string
  ageGroup?: string
  level: string
}

export type AthleteMembershipData = {
  uciId: string
  firstName: string
  lastName: string
  licenses: AthleteLicense[]
}