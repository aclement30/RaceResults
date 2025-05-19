import { fetchFile, type GroupedEventFile } from './aws-s3'
import type {CrossMgrEventResultPayload} from '../types/CrossMgr.ts'
import type {EventResult, PrimeResultRow, RaceCategory, RacerResult} from '../types/results.ts'

export async function fetchResultPayloads(filenames: string[]) {
  const payloads = await Promise.all(filenames.map(async (filename: string) => {
    const content = await fetchFile(filename)

    const PAYLOAD_START_MARKER = /\/\* !!! payload begin !!! \*\/[^{]+\{/g
    const PAYLOAD_END_MARKER = /\}\s*;\s*\/\* !!! payload end !!! \*\//g
    
    let result = PAYLOAD_START_MARKER.exec(content)
    if (result == null) throw new Error('Could not find payload start for file "' + filename + '"')
    let pStart = PAYLOAD_START_MARKER.lastIndex - 1

    result = PAYLOAD_END_MARKER.exec(content)
    if (result == null) throw new Error('Could not find payload end for file "' + filename + '"')
    let pEnd = result.index + 1

    const payloadJson = content.substring(pStart, pEnd)
    const payload = JSON.parse(payloadJson)

    return payload
  }))

  return payloads
}

export async function getEventResults(params: {
  date: string,
  organizer: string,
  eventName: string
}, allFiles: GroupedEventFile[]) {
  const eventFileGroup = allFiles.find((file: GroupedEventFile) => file.date === params.date && file.organizer === params.organizer && file.name === params.eventName)

  if (!eventFileGroup) throw new Error('No event file found!')

  const { files: filenames } = eventFileGroup

  const payloads = await fetchResultPayloads(filenames)

  const shapedResults = shapeCrossMgrEventResults(payloads)

  return shapedResults
}

const formatCrossMgrCategoryAlias = (catName: string): string => {
  const alias = catName.toUpperCase().replace('(MEN)', 'M').replace('(WOMEN)', 'W').replace(/\s/g, '-').trim()

  return alias
}

export function shapeCrossMgrEventResults(payloads: CrossMgrEventResultPayload[]): EventResult {
  const combinedCategories = payloads.reduce((acc, payload) => {
    payload.catDetails.forEach((cat) => {
      const categoryGender = cat.gender === 'Men' ? 'M' : cat.gender === 'Women' ? 'F' : 'X'
      const alias = formatCrossMgrCategoryAlias(cat.name)

      if (cat.name !== 'All') {
        acc.push({
          alias,
          label: cat.name.replace('(Men)', '(M)').replace('(Women)', '(W)'),
          startOffset: cat.startOffset,
          gender: categoryGender,
          laps: cat.laps,
          starters: cat.starters,
          finishers: cat.finishers,
          distanceUnit: cat.distanceUnit,
          lapDistance: cat.lapDistance,
          raceDistance: cat.raceDistance,
        })
      }
    })

    return acc
  }, [] as RaceCategory[])

  const combinedData = payloads.reduce((acc, payload) => {
    Object.keys(payload.data).forEach((bibNumber) => {
      const racerResult = payload.data[bibNumber]
      const racerGender = racerResult.Gender === 'Men' ? 'M' : racerResult.Gender === 'Women' ? 'F' : 'X'
      const categoryAlias = formatCrossMgrCategoryAlias(`${racerResult.Category} (${racerResult.Gender})`)
      const categoryDetails = payload.catDetails.find((cat) => cat.name === `${racerResult.Category} (${racerResult.Gender})`)

      if (!categoryDetails) {
        console.log('No category details found for bib number:', `${racerResult.Category} (${racerResult.Gender})`)
      }

      let position = -1
      let gapValue = 0

      if (racerResult.status === 'Finisher') {
        const positionInCategory = categoryDetails?.pos.findIndex((posBibNumber) => posBibNumber === +bibNumber)

        if (positionInCategory === undefined || positionInCategory < 0) {
          console.log('No position found for bib number:', bibNumber, 'in category:', racerResult.Category, '(', racerResult.Gender, ')')
        } else {
          position = positionInCategory + 1
          gapValue = categoryDetails!.gapValue[positionInCategory]
        }
      }

      acc.push({
        bibNumber: +bibNumber,
        category: categoryAlias,
        firstName: racerResult.FirstName,
        lastName: racerResult.LastName,
        age: racerResult.Age,
        gender: racerGender,
        city: racerResult.City,
        state: racerResult.StateProv,
        license: racerResult.License,
        uciId: racerResult.UCIID,
        team: racerResult.Team,
        position,
        lapSpeeds: racerResult.lapSpeeds,
        avgSpeed: +(racerResult.speed.replace('km/h', '').trim()),
        status: racerResult.status.toUpperCase() as 'FINISHER' | 'DNF' | 'DNS',
        relegated: racerResult.relegated,
        finishTime: racerResult.lastTime - (racerResult.raceTimes?.[0] || 0),
        gapValue: gapValue,
      })
    })

    return acc
  }, [] as RacerResult[])

  const combinedPrimes = payloads.reduce((acc, payload) => {
    if (payload.primes) {
      payload.primes.forEach((prime) => {
        acc.push(prime)
      })
    }

    return acc
  }, [] as PrimeResultRow[])

  return {
    raceName: payloads[0].raceName,
    raceNameText: payloads[0].raceNameText,
    raceAddress: payloads[0].raceAddress,
    raceDate: payloads[0].raceDate,
    raceNotes: payloads[0].raceNotes,
    organizer: payloads[0].organizer,
    organizerEmail: payloads[0].email,
    flags: payloads[0].flags,
    // scheduledStartTime: payloads[0].raceScheduledStart,
    fieldLabels: payloads[0].infoFields,
    data: combinedData,
    isTimeTrial: payloads[0].isTimeTrial,
    primes: combinedPrimes,
    categories: combinedCategories,
  }
}

export function formatFinishTime(seconds: number): string {
  if (seconds >= 3600) {
    return new Date(seconds * 1000).toISOString().slice(11, 19);
  } else {
    return new Date(seconds * 1000).toISOString().slice(14, 19);
  }
}

export function formatGapTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)

  if (seconds >= 3600) {
    // Response format should be hh mm'ss"
    // const minutes = Math.floor((seconds % 3600) / 60)
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes
    const formattedSeconds = remainingSeconds < 10 ? `0${remainingSeconds}` : remainingSeconds

    return `+ ${hours}h ${formattedMinutes}' ${formattedSeconds}"`
  } else if (seconds >= 60) {
    // Response format should be mm'ss"
    const formattedSeconds = remainingSeconds < 10 ? `0${remainingSeconds}` : remainingSeconds

    return `+ ${minutes}' ${formattedSeconds}"`
  } else {
    if (remainingSeconds < 0) return '-'

    // Response format should be ss"
    return `+ ${remainingSeconds}"`
  }
}