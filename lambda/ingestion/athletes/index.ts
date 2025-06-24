import { PARSER_NAME } from './config.ts'
import defaultLogger from '../shared/logger.ts'
import { fetchEventResultFilesForYear, loadLatestAthleteCategories, loadOverrides } from './utils.ts'
import { TeamParser } from '../shared/team-parser.ts'

// Steps
import extractData from './data/extract.ts'
import extractUpgradePoints from './upgrade-points/extract.ts'
import extractAthleteRaces from './races/extract.ts'
import cleanData from './data/clean.ts'
import cleanUpgradePoints from './upgrade-points/clean.ts'
import cleanAthleteRaces from './races/clean.ts'
import processUpgradeDates from './upgrade-dates/process.ts'
import cleanAthleteTeams from './team/clean.ts'
import processCompilations from './compilations/process.ts'
import createLookupTable from './data/create-lookup-table.ts'
import unpackData from './unpack.ts'

const logger = defaultLogger.child({ parser: PARSER_NAME })

export const handler = async (options: { year: number }) => {
  logger.info(`Parser: ${PARSER_NAME}`)
  logger.info(`Options: ${JSON.stringify(options)}`)

  await TeamParser.init()

  const yearStoredEventFiles = await fetchEventResultFilesForYear(options.year)
  const athletesOverrides = await loadOverrides()
  const athletesCategories = await loadLatestAthleteCategories()

  // Process athletes data first
  const extractedAthletes = await extractData(yearStoredEventFiles, athletesOverrides)
  const cleanedAthleteData = await cleanData({
    athletes: extractedAthletes,
    athletesCategories,
    athletesOverrides,
    year: options.year
  })
  const lookupTable = await createLookupTable(cleanedAthleteData, athletesOverrides)

  // Extract upgrade points after athletes data is cleaned
  const extractedUpgradePoints = await extractUpgradePoints(yearStoredEventFiles)
  const cleanedAthleteUpgradePoints = await cleanUpgradePoints({
    athletesUpgradePoints: extractedUpgradePoints,
    athletesLookupTable: lookupTable,
    athletesOverrides
  })

  // Extract athlete races
  const extractedAthleteRaces = await extractAthleteRaces(yearStoredEventFiles)
  const cleanedAthleteRaces = await cleanAthleteRaces(extractedAthleteRaces, lookupTable, athletesOverrides)

  const cleanedAthleteTeams = await cleanAthleteTeams(cleanedAthleteData, cleanedAthleteRaces, athletesOverrides)

  const cleanedAthleteUpgradeDates = await processUpgradeDates({
    athletesData: cleanedAthleteData,
    athletesRaces: cleanedAthleteRaces,
    athletesCategories,
    athletesOverrides
  })

  await processCompilations(
    {
      athletesData: cleanedAthleteData,
      athletesUpgradePoints: cleanedAthleteUpgradePoints,
      athletesUpgradeDates: cleanedAthleteUpgradeDates,
      athletesRaces: cleanedAthleteRaces
    }
  )

  // Unpack cleaned data for client-side usage
  await unpackData(cleanedAthleteData, {
    allAthleteUpgradePoints: cleanedAthleteUpgradePoints,
    allAthleteRaces: cleanedAthleteRaces,
    allAthleteUpgradeDates: cleanedAthleteUpgradeDates,
    allAthleteTeams: cleanedAthleteTeams,
  })

  return {
    statusCode: 200,
    body: JSON.stringify({
      year: options.year,
      extractedAthletes: extractedAthletes.length,
      extractedUpgradePoints: extractedUpgradePoints.length,
      cleanedAthletes: Object.keys(cleanedAthleteData).length,
      cleanedAthleteUpgradePoints: Object.keys(cleanedAthleteUpgradePoints).length,
      cleanedAthleteRaces: Object.keys(cleanedAthleteRaces).length,
      parser: PARSER_NAME
    }),
  }
}
