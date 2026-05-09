import data from './data.ts'
import { validateUCIId } from '../processing/utils.ts'

class AthleteFinderSingleton {
  private _lookupTable: Record<string, string>
  private _replacedUciIds: Record<string, { old: string, new: string, name: string }>

  constructor() {
    this._lookupTable = {}
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

    return this._lookupTable[nameKey] || null
  }

  public getReplacedUciId(uciId: string): string {
    if (this._replacedUciIds[uciId]) return this._replacedUciIds[uciId].new
    return uciId
  }
}

const AthleteFinder = new AthleteFinderSingleton()

export { AthleteFinder }