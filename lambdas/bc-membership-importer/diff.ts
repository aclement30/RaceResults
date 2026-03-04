import { diff as consoleDiff } from 'jest-diff'
import data from '../shared/data.ts'

const DISCIPLINES = ['ROAD', 'CYCLOCROSS']
const currentYear = new Date().getFullYear()

;(async () => {
  const importDates = await data.get.rawBCMembershipDates().then(list => list.reverse())

  const [lastDateMemberships, beforeLastFileMemberships] = await Promise.all([
    data.get.rawBCMemberships(importDates[0]),
    data.get.rawBCMemberships(importDates[1]),
  ])

  console.log('New memberships:')
  Object.keys(lastDateMemberships).forEach((uciId) => {
    const currentMembership = lastDateMemberships[uciId]
    const previousMembership = beforeLastFileMemberships[uciId]

    if (!previousMembership) {
      console.log(currentMembership)
    }
  })

  console.log('Updated memberships:')
  Object.keys(lastDateMemberships).forEach((uciId) => {
    const currentMembership = lastDateMemberships[uciId]
    const previousMembership = beforeLastFileMemberships[uciId]

    if (!previousMembership) return

    const currentLicenses = currentMembership?.licenses
    const previousLicenses = previousMembership?.licenses

    DISCIPLINES.forEach((discipline) => {
      const currentLicense = currentLicenses?.find(l => l.discipline === discipline && l.year === currentYear)
      const previousLicense = previousLicenses?.find(l => l.discipline === discipline && l.year === currentYear)

      if (currentLicense && (!previousLicense || currentLicense.text !== previousLicense.text)) {
        console.log(`${uciId} - ${currentMembership?.firstName} ${currentMembership?.lastName}`)
        console.log(consoleDiff(currentLicense, previousLicense || {}, {
          aAnnotation: 'New',
          bAnnotation: 'Existing',
        }))
      }
    })
  })

  console.log('Deleted memberships:')
  Object.keys(beforeLastFileMemberships).forEach((uciId) => {
    const previousMembership = beforeLastFileMemberships[uciId]
    const currentMembership = lastDateMemberships[uciId]

    if (!currentMembership) {
      console.log(previousMembership)
    }
  })
})()