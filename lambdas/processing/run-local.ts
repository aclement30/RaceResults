import { cleanAthletes } from './athletes/clean.ts'
import logger from '../shared/logger.ts'
import { ENV } from '../shared/config.ts'
import { createAthleteLookupTable } from './athletes/create-lookup-table.ts'
import { TeamParser } from '../shared/team-parser.ts'
import { extractAthletes } from './athletes/extract.ts'
import { extractRaceResults } from './race-results/extract.ts'
import { cleanRaceResults } from './race-results/clean.ts'
import { extractUpgradePoints } from './upgrade-points/extract.ts'
import { cleanUpgradePoints } from './upgrade-points/clean.ts'
import { extractAthletesTeams } from './teams/extract.ts'
import { cleanAthletesTeams } from './teams/clean.ts'
import { processAthletesUpgradeDates } from './upgrade-dates/process.ts'
import { createViewAthletes } from './views/athletes.ts'
import { createViewAthleteProfiles } from './views/athlete-profiles.ts'
import { AthleteFinder } from '../shared/athlete-finder.ts'
import { createViewRecentlyUpgradedAthletes } from './views/recently-upgraded-athletes.ts'

const options = {
    year: 2026,
  }

;(async () => {
  logger.info(`ENV: ${ENV}`)

  await TeamParser.init()

  // Process athletes data first
  const { eventHashes: athleteEventHashes } = await extractAthletes(options)
  const updatedAthleteIds = await cleanAthletes({ year: options.year, eventHashes: athleteEventHashes })
  await createAthleteLookupTable()

  await AthleteFinder.init()

  // Process race results
  const { eventHashes: raceResultsEventHashes } = await extractRaceResults(options)
  const { athleteIds: updatedRaceAthleteIds } = await cleanRaceResults({
    year: options.year,
    eventHashes: raceResultsEventHashes
  })

  // Extract upgrade points after athletes data is cleaned
  await extractUpgradePoints({ year: options.year, eventHashes: raceResultsEventHashes })
  await cleanUpgradePoints({
    year: options.year,
    eventHashes: raceResultsEventHashes
  })

  const allUpdatedAthleteIds = Array.from(new Set([...updatedAthleteIds, ...updatedRaceAthleteIds]))

  // Extract teams for updated athletes
  await extractAthletesTeams({ year: options.year, eventHashes: raceResultsEventHashes })
  await cleanAthletesTeams({ athleteIds: allUpdatedAthleteIds, year: options.year })

  // Process upgrade dates after athletes
  await processAthletesUpgradeDates({ athleteIds: allUpdatedAthleteIds })

  await createViewAthletes({ athleteIds: allUpdatedAthleteIds })

  // Unpack cleaned data for client-side usage
  await createViewAthleteProfiles({
    athleteIds: allUpdatedAthleteIds,
    year: options.year,
    eventHashes: raceResultsEventHashes
  })
  await createViewRecentlyUpgradedAthletes()
})()