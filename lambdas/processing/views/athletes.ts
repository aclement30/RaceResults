import { omit } from 'lodash-es'
import { diff } from 'deep-object-diff'
import defaultLogger from '../../shared/logger.ts'
import { SCRIPT_NAME } from '../config.ts'
import { DEBUG } from '../../shared/config.ts'
import data from '../../shared/data.ts'

const logger = defaultLogger.child({ parser: SCRIPT_NAME })

export const createViewAthletes = async ({ athleteIds }: {
  athleteIds: string[]
}) => {
  const [
    allBaseAthletes,
    allAthleteManualEdits,
  ] = await Promise.all([
    data.get.baseAthletes(),
    data.get.athleteManualEdits(),
  ])

  let updatedAthletes = allBaseAthletes
  .filter(({ uciId }) => athleteIds.includes(uciId))

  updatedAthletes = updatedAthletes.map((baseAthlete) => {
    let athleteUciId = baseAthlete.uciId

    const manualEdit = allAthleteManualEdits.find(edit => edit.uciId === athleteUciId)

    if (manualEdit) {
      const mergedAthlete = {
        ...baseAthlete,
        ...omit(manualEdit, ['uciId']),
      }

      const changedFields = diff(baseAthlete, mergedAthlete)

      if (DEBUG && Object.keys(changedFields).length > 0) {
        logger.info(`Applying manual edit for athlete ${baseAthlete.firstName} ${baseAthlete.lastName} (${athleteUciId}), changed fields: ${Object.keys(changedFields).join(', ')}`)
      }

      return mergedAthlete
    }

    return baseAthlete
  })

  await data.update.viewAthletes(updatedAthletes)
}
