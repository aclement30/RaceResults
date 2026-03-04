import data from './data.ts'
import { validateUCIId } from '../processing/utils.ts'

class AthleteFinderSingleton {
  private _lookupTable: Record<string, string>
  private _alternateNames: Record<string, string>
  private _replacedUciIds: Record<string, { old: string, new: string, name: string }>

  constructor() {
    this._lookupTable = {}
    this._alternateNames = {}
    this._replacedUciIds = {}
  }

  public async init(reload = false) {
    // Check if already initialized
    if (!reload && Object.keys(this._lookupTable).length > 0) return

    const [
      athletesLookupTable,
      athletesOverrides,
    ] = await Promise.all([
      data.get.athletesLookup(),
      data.get.athletesOverrides(),
    ])

    this._lookupTable = athletesLookupTable
    this._alternateNames = athletesOverrides.alternateNames || {}
    this._replacedUciIds = athletesOverrides.replacedUciIds || {}
  }

  public findAthleteUciId(
    params: {
      firstName?: string,
      lastName?: string,
      uciId?: string
    }
  ): string | null {
    const { uciId, firstName, lastName } = params

    if (uciId && validateUCIId(uciId)) return uciId

    const nameKey = `${firstName?.toLowerCase()}|${lastName?.toLowerCase()}`

    // Attempt to find athlete UCI ID by using the lookup table
    if (this._lookupTable[nameKey]) return this._lookupTable[nameKey]

    // Check if there is an override for the athlete
    if (this._alternateNames?.[nameKey]) return this._alternateNames[nameKey]

    return null
  }

  public getReplacedUciId(uciId: string): string {
    if (this._replacedUciIds[uciId]) return this._replacedUciIds[uciId].new
    return uciId
  }
}

const AthleteFinder = new AthleteFinderSingleton()

export { AthleteFinder }