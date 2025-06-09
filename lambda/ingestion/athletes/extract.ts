import type { AthleteOverrides } from '../../parsers/athletes/types.ts'
import type { Athlete } from '../../../src/types/athletes.ts'
import defaultLogger from '../shared/logger.ts'
import { PARSER_NAME } from './config.ts'
import type { CleanEventAthlete } from '../shared/types.ts'
import { capitalize, formatProvince, formatTeamName } from '../shared/utils.ts'

const logger = defaultLogger.child({ parser: PARSER_NAME })

export const extractEventAthletes = async (eventAthletes: Record<string, CleanEventAthlete>, date: string, overrides: AthleteOverrides): Promise<Athlete[]> => {
  const allAthletes: Record<string, Athlete> = {}
  const year = +date.substring(0, 4)

  Object.values(eventAthletes).forEach((eventAthlete) => {
    const { firstName, lastName, gender, city, province, license, age, team } = eventAthlete
    let { uciId } = eventAthlete

    if (!uciId) {
      // logger.warn(`Athlete ${firstName} ${lastName} has no UCI ID for event (${date}), skipping`)
      return
    }

    if (!uciId.match(/^\d{11}$/)) {
      logger.warn(`Invalid UCI ID format for athlete: ${uciId} (${firstName} ${lastName}), skipping`)
      return
    }

    if (overrides?.replacedUciIds?.[uciId]) {
      const newUciId = overrides.replacedUciIds[uciId].new
      logger.info(`Replaced UCI ID ${uciId} -> ${newUciId} for athlete: ${firstName} ${lastName}`)
      uciId = newUciId
    }

    // if (overrides?.deactivatedUciIds?.includes(uciId)) {
    //   logger.warn(`Deactivated UCI ID ${uciId} for athlete ${firstName} ${lastName}, skipping`)
    //   return
    // }

    if (allAthletes[uciId]) {
      logger.warn(`Duplicate athlete found: ${firstName} ${lastName} with UCI ID ${uciId}, skipping`)
      return
    }

    allAthletes[uciId] = {
      uciId,
      firstName: capitalize(firstName) || null,
      lastName: capitalize(lastName) || null,
      gender: gender || 'X',
      city: capitalize(city) || null,
      province: province ? formatProvince(province) : null,
      birthYear: age ? year - age : new Date().getFullYear(),
      licenses: license && license.toUpperCase() !== 'TEMP' ? { [year]: [license.toUpperCase().trim()] } : {},
      teams: {
        [year]: team && formatTeamName(team) !== 'Independent' ? [formatTeamName(team)] : []
      },
      lastUpdated: date
    }
  })

  return Object.values(allAthletes)
}