import { startCase } from 'lodash-es'
import {
  createUmbrellaCategories,
  formatCategoryAlias,
  getCombinedRaceCategories,
  transformCategoryLabel
} from 'shared/categories'
import {
  formatRaceNotes,
  getEventDiscipline,
  getRaceType,
  getSanctionedEventType,
  transformLocation,
  transformOrganizerAlias,
  transformSerieAlias
} from 'shared/events'
import defaultLogger from 'shared/logger.ts'
import { TeamParser } from 'shared/team-parser'
import type { CreateEventCategory, CreateEventResults, ParticipantResult, UpdateEvent, } from 'shared/types.ts'
import { calculateBCUpgradePoints, calculateFieldSize, hasUpgradePoints, } from 'shared/upgrade-points'
import { calculateLapGaps, capitalize, convertLocalDateToUTC, formatProvince, formatStatus, } from 'shared/utils'
import { PROVIDER_NAME, SOURCE_URL_PREFIX } from '../config.ts'
import type { CrossMgrEventBundle, CrossMgrEventRawData, CrossMgrEventResultPayload } from '../types.ts'

const logger = defaultLogger.child({ provider: PROVIDER_NAME })

export const parseRawEvent = async (
  eventBundle: CrossMgrEventBundle,
  payloads: CrossMgrEventRawData['payloads'],
): Promise<{ event: UpdateEvent, eventResults: CreateEventResults }> => {
  const firstPayload = Object.values(payloads)[0]
  const eventName = startCase(firstPayload.raceNameText.split('-')[0])
  const organizerAlias = await transformOrganizerAlias(eventBundle.organizer, {
    eventName,
    organizerName: firstPayload.organizer,
    year: eventBundle.year
  })
  const serie = await transformSerieAlias({
    alias: eventBundle.serie,
    organizerAlias: eventBundle.organizer,
    year: eventBundle.year
  }) || null

  logger.info(`Parsing raw data for ${eventBundle.type} ${eventBundle.hash}: ${eventName}`)

  const sanctionedEventType = await getSanctionedEventType({
    eventName,
    organizerAlias,
    year: eventBundle.year,
    serieAlias: serie,
  })

  const allEventRaceNotes = Object.values(payloads).reduce((acc, payload) => {
    if (payload.raceNotes?.trim().length) acc = acc += formatRaceNotes(payload.raceNotes) + '<br />'
    return acc
  }, '')

  const event: UpdateEvent = {
    hash: eventBundle.hash,
    date: eventBundle.date!,
    discipline: await getEventDiscipline({ eventName, organizerAlias, serieAlias: serie }),
    location: transformLocation(firstPayload.raceAddress),
    organizerAlias,
    name: eventName,
    serie,
    sanctionedEventType,
    raceType: null,
    sourceUrls: Object.keys(payloads).map(filename => SOURCE_URL_PREFIX + filename),
    raceNotes: allEventRaceNotes,
    // Metadata
    provider: PROVIDER_NAME,
    updatedAt: eventBundle.lastUpdated,
    published: false,
  }

  event.raceType = await getRaceType({ ...event, isTimeTrial: firstPayload.isTimeTrial })

  if (event.raceType === 'TT' && !event.name.includes('TT')) event.name = `${event.name} TT`

  const allEventPrimes = Object.values(payloads).reduce((acc, payload) => {
    if (payload.primes) {
      payload.primes.forEach((prime) => {
        acc.push(prime)
      })
    }

    return acc
  }, [] as CrossMgrEventResultPayload['primes'])

  let allEventCategories: CreateEventCategory[] = []
  for (const [filename, payload] of Object.entries(payloads)) {
    if (payload.raceIsRunning && !payload.isTimeTrial) {
      const raceStartUTC = convertLocalDateToUTC(payload.raceScheduledStart, payload.raceTimeZone)
      const threeHoursAfterStart = raceStartUTC.getTime() + 3 * 60 * 60 * 1000
      if (Date.now() < threeHoursAfterStart) {
        logger.warn(`Skipping results for ${eventBundle.hash} — race is still running`, {
          hash: eventBundle.hash,
          year: eventBundle.year,
          sourceUrl: filename,
        })
        continue
      }
    }

    if (!payload.catDetails) continue

    for (const cat of payload.catDetails) {
      // Ignore "All" category which is just an aggregate of all other categories
      if (cat.name === 'All') continue

      const categoryGender = cat.gender === 'Men' ? 'M' : cat.gender === 'Women' ? 'F' : 'X'
      const alias = formatCategoryAlias(cat.name)
      const categoryName = await transformCategoryLabel(cat.name, {
        eventName: event.name,
        organizerAlias: event.organizerAlias,
        year: eventBundle.year
      })

      let participantResults: ParticipantResult[] = cat.pos.map((bibNumber, index) => {
        const rawResultRow = payload.data?.[bibNumber]

        if (!rawResultRow) {
          logger.warn('Error: cannot find athlete data for bib #' + bibNumber + ` (category: ${cat.name})`, {
            hash: eventBundle.hash,
            athleteData: rawResultRow
          })
          return
        }

        let position = -1
        let finishGap = 0

        if (rawResultRow.status === 'Finisher') {
          position = index + 1
          finishGap = cat.gapValue[index]
        }

        // Transform lap finish times into lap durations
        const lapDurations = rawResultRow.raceTimes.reduce((acc, lapFinishTime, i) => {
          if (i > 0) {
            const previousLapFinishTime = rawResultRow.raceTimes[i - 1]

            acc.push(lapFinishTime - previousLapFinishTime)
          }

          return acc
        }, [] as number[])

        const racerGender: 'M' | 'F' | 'X' | undefined = rawResultRow.Gender === 'Men' ? 'M' : rawResultRow.Gender === 'Women' ? 'F' : undefined
        const formattedUCIId = rawResultRow.UCIID?.replace(/\s/g, '').trim()
        let team = TeamParser.parseTeamName(rawResultRow.Team)
        // If athlete has an override for the current year team, use that instead
        const teamOverride = TeamParser.getManualTeamForAthlete(formattedUCIId, eventBundle.year)
        if (teamOverride) {
          team = teamOverride
        }

        return {
          participantId: bibNumber.toString(),
          bibNumber: +bibNumber,
          // Demographic data
          firstName: capitalize(rawResultRow.FirstName),
          lastName: capitalize(rawResultRow.LastName),
          age: rawResultRow.Age ? +rawResultRow.Age : undefined,
          gender: racerGender,
          city: rawResultRow.City && rawResultRow.City.length ? rawResultRow.City : undefined,
          province: formatProvince(rawResultRow.StateProv),
          license: rawResultRow.License,
          uciId: formattedUCIId && formattedUCIId.length ? formattedUCIId : undefined,
          team: team?.name,
          nationality: rawResultRow.NatCode?.length ? rawResultRow.NatCode.toUpperCase() : undefined,
          // Finish position
          position,
          status: formatStatus(rawResultRow.status),
          // relegated: athleteData.relegated,
          // Timing data
          finishTime: rawResultRow.lastTime - (rawResultRow.raceTimes?.[0] || 0),
          finishGap,
          lapSpeeds: rawResultRow.lapSpeeds,
          lapDurations,
          lapTimes: rawResultRow.raceTimes,
          avgSpeed: +(rawResultRow.speed.replace('km/h', '').trim()),
        }
      }).filter(result => result !== undefined)

      participantResults = calculateLapGaps(participantResults, cat.laps)

      const starters = participantResults.filter(result => result.status !== 'DNS').length
      const finishers = participantResults.filter(result => result.status === 'FINISHER').length

      const primes = allEventPrimes.filter(prime => cat.pos.includes(prime.winnerBib)).map((prime, index) => {
        return {
          number: index + 1,
          position: prime.position,
          participantId: prime.winnerBib.toString(),
        }
      })

      if (cat.distanceUnit !== 'km') throw new Error(`Unsupported distance unit ${cat.distanceUnit} in category ${cat.name} for event ${event.name}`)

      allEventCategories.push({
        alias,
        label: categoryName,
        gender: categoryGender,
        startTime: payload.raceStartTime + cat.startOffset,
        laps: cat.laps,

        starters: cat.starters || starters,
        finishers: cat.finishers || finishers,
        lapDistanceKm: cat.lapDistance,
        raceDistanceKm: cat.raceDistance,

        results: participantResults,
        primes,
        upgradePoints: null,

        updatedAt: eventBundle.lastUpdated,
      })
    }
  }

  // Check if some categories are combined
  const combinedCategoryGroups = await getCombinedRaceCategories({
    eventHash: event.hash,
    serieAlias: event.serie,
    organizerAlias: event.organizerAlias,
    eventName: event.name,
    year: eventBundle.year,
  })

  // Create umbrella categories for combined categories
  const {
    categories: updatedCategories,
    errors: umbrellaCategoriesErrors
  } = createUmbrellaCategories(allEventCategories, combinedCategoryGroups)

  allEventCategories = updatedCategories
  if (umbrellaCategoriesErrors?.length) {
    umbrellaCategoriesErrors.forEach(error => {
      logger.warn(error, {
        provider: PROVIDER_NAME,
        eventHash: eventBundle.hash,
        year: eventBundle.year,
      })
    })
  }

  // Some athletes have duplicate results with DNS and an actual position, we need to filter out the DNS ones
  allEventCategories = allEventCategories.map((category) => {
    // Filter athlete results to only include athletes that are in the athlete list (remove deleted athletes)
    const filteredResults = category.results.filter(result => {
      if (result.status === 'DNS') {
        const hasNonDNSResult = category.results.some(otherResult => {
          return otherResult.status !== 'DNS' && otherResult.firstName === result.firstName && otherResult.lastName === result.lastName
        })

        if (hasNonDNSResult) {
          logger.warn(`Filtering out DNS result for athlete ${result.firstName} ${result.lastName} in category ${category.label} because a non-DNS result exists with the same name.`, {
            eventHash: eventBundle.hash,
            year: eventBundle.year,
            categoryAlias: category.alias,
          })

          return false
        }
      }

      return true
    })

    return {
      ...category,
      results: filteredResults,
    }
  })

  if (hasUpgradePoints(sanctionedEventType)) {
    const parentCategories = allEventCategories.reduce((acc, category) => {
      if (category.parentCategory) acc.add(category.alias)
      return acc
    }, new Set<string>())

    // Calculate upgrade points for each category
    allEventCategories = allEventCategories.map((category) => {
      let categoryGroup
      let fieldSize

      if (parentCategories.has(category.alias)) {
        categoryGroup = combinedCategoryGroups.find(group => group.parentCategory === category.alias)

        // Dont calculate upgrade points for parent categories, unless specified
        if (categoryGroup?.categoriesForPoints !== 'PARENT') return category

        const subCategories = [category]
        fieldSize = calculateFieldSize(subCategories)
      } else {
        categoryGroup = combinedCategoryGroups.find(group => group.categories.some(c => c === category.alias))

        // Dont calculate upgrade points for combined categories, unless specified
        if (categoryGroup?.categoriesForPoints === 'PARENT') return category

        const subCategories = categoryGroup?.categories.map(alias => allEventCategories.find(c => c.alias === alias)!) || [category]
        fieldSize = calculateFieldSize(subCategories)
      }

      // Calculate upgrade points for the category/combined categories
      const upgradePoints = calculateBCUpgradePoints({
        category,
        fieldSize,
        eventType: sanctionedEventType,
      })

      return {
        ...category,
        fieldSize,
        upgradePoints,
      }
    })
  }

  // Only publish event if it has at least one category with results
  if (Object.keys(allEventCategories).length) event.published = true

  return {
    event,
    eventResults: {
      hash: event.hash,
      categories: allEventCategories,
    }
  }
}
