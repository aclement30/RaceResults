import _ from 'lodash'
import defaultLogger from '../shared/logger.ts'
import { PARSER_NAME } from './config.ts'
import type { Athlete, AthleteProfile } from '../../../src/types/athletes.ts'
import { PUBLIC_BUCKET_FILES, PUBLIC_BUCKET_PATHS } from '../../../src/config/s3.ts'
import { s3 as RRS3 } from '../shared/utils.ts'
import type {
  CleanAthlete,
  CleanAthleteEventRaces,
  CleanAthleteEventUpgradePoints, CleanAthleteTeam,
  CleanAthleteUpgradeDate
} from './types.ts'
import { DEBUG } from '../shared/config.ts'

const logger = defaultLogger.child({ parser: PARSER_NAME })

export default async (
  athletes: Record<string, CleanAthlete>,
  { allAthleteUpgradePoints, allAthleteUpgradeDates, allAthleteRaces, allAthleteTeams, skipProfileUpload }: {
    allAthleteUpgradePoints: CleanAthleteEventUpgradePoints
    allAthleteUpgradeDates: Record<string, CleanAthleteUpgradeDate>
    allAthleteRaces: CleanAthleteEventRaces
    allAthleteTeams: Record<string, CleanAthleteTeam>
    skipProfileUpload?: boolean
  }
) => {
  const shapedAthletes = _.mapValues(athletes, (value) => shapeAthlete(value, allAthleteUpgradeDates, allAthleteTeams)) as Record<string, Athlete>

  try {
    // Save athletes data
    logger.info(`Uploading ${Object.keys(shapedAthletes).length} athletes to ${PUBLIC_BUCKET_FILES.athletes.list}`)
    await RRS3.writeFile(PUBLIC_BUCKET_FILES.athletes.list, JSON.stringify(shapedAthletes))
  } catch (error) {
    logger.error(`Failed to save athletes to ${PUBLIC_BUCKET_FILES.athletes.list}:` + (error as any).message, { error })
  }

  if (!skipProfileUpload) {
    const athleteProfiles = shapeAthleteProfiles(shapedAthletes, { allAthleteUpgradePoints, allAthleteRaces })

    logger.info(`Uploading ${Object.keys(athleteProfiles).length} athletes profiles to ${PUBLIC_BUCKET_PATHS.athletesProfiles}`)

    for (const [athleteUciId, athleteProfile] of Object.entries(athleteProfiles)) {
      const athleteProfileFilePath = `${PUBLIC_BUCKET_PATHS.athletesProfiles}${athleteUciId}.json`

      try {
        // Save athlete profile
        if (DEBUG) logger.info(`Uploading athlete profile for ${athleteUciId} to ${athleteProfileFilePath}`)
        await RRS3.writeFile(athleteProfileFilePath, JSON.stringify(athleteProfile))
      } catch (error) {
        logger.error(`Failed to save athlete profile to ${athleteProfileFilePath}:` + (error as any).message, {
          error,
          athleteUciId
        })
      }
    }
  }
}

const shapeAthlete = (
  athlete: CleanAthlete,
  allAthleteUpgradeDates: Record<string, CleanAthleteUpgradeDate>,
  allAthleteTeams: Record<string, CleanAthleteTeam>
): Athlete => {
  return {
    ...athlete,
    latestUpgrade: allAthleteUpgradeDates[athlete.uciId] || undefined,
    team: allAthleteTeams[athlete.uciId],
  }
}

const shapeAthleteProfiles = (athletes: Record<string, Athlete>, { allAthleteUpgradePoints, allAthleteRaces }: {
  allAthleteUpgradePoints: CleanAthleteEventUpgradePoints
  allAthleteRaces: CleanAthleteEventRaces
}): Record<string, AthleteProfile> => {
  return Object.keys(athletes).reduce((acc, uciId) => {
    const athleteProfile: AthleteProfile = {
      uciId,
    }

    if (allAthleteUpgradePoints[uciId]) {
      athleteProfile.upgradePoints = allAthleteUpgradePoints[uciId].map(point => ({
        ..._.omit(point, 'athleteUciId', 'firstName', 'lastName'),
      }))
    }

    if (allAthleteRaces[uciId]) {
      athleteProfile.races = allAthleteRaces[uciId].map(race => ({
        ..._.omit(race, 'athleteUciId', 'firstName', 'lastName'),
      }))
    }

    acc[uciId] = athleteProfile
    return acc
  }, {} as Record<string, AthleteProfile>)
}