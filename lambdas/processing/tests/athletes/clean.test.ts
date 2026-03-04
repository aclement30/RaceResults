// Mock the dependencies FIRST before any imports
jest.mock('../../../shared/data')

// Import and use shared logger mock
import { createLoggerMock, clearLoggerMocks } from '../__mocks__/logger'

jest.mock('../../../shared/logger', () => createLoggerMock())

jest.mock('../../config', () => ({
  DEFAULT_EVENT_FILTERS: {},
}))

import { cleanAthletes } from '../../athletes/clean'
import data from '../../../shared/data'
import type { Athlete, AthleteSkillCategory } from '../../../shared/types'

const mockData = data as jest.Mocked<typeof data>

// Base mock data for reuse
const baseMockCleanAthlete: Athlete = {
  uciId: '12345678901',
  firstName: 'John',
  lastName: 'Doe',
  gender: 'M',
  city: 'Toronto',
  province: 'ON',
  birthYear: 1990,
  licenses: { 2023: ['ABC123'] },
  nationality: 'CAN',
  lastUpdated: '2023-06-15'
}

const baseMockRawAthlete = {
  uciId: '12345678902',
  firstName: 'Jane',
  lastName: 'Smith',
  gender: 'F' as const,
  city: 'Vancouver',
  province: 'BC',
  birthYear: 1985,
  licenses: { 2023: ['DEF456'] },
  nationality: 'CAN',
  lastUpdated: '2023-07-20'
}

const baseMockAthleteCategories: AthleteSkillCategory[] = [
  {
    athleteUciId: '12345678901',
    skillLevels: {
      ROAD: {
        '2023-01-01': '1'
      }
    },
    ageCategory: 'ELITE'
  }
]

const baseMockAthletesOverrides = {
  athleteData: {
    '12345678901': {
      city: 'Ottawa'
    }
  }
}

describe('cleanAthletes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    clearLoggerMocks()
  })

  it('should process new and existing athletes successfully', async () => {
    const existingAthletes = [baseMockCleanAthlete]
    const rawEventAthletes = [baseMockRawAthlete]

    ;(mockData.get.baseAthletes as jest.Mock).mockResolvedValue(existingAthletes)
    ;(mockData.get.athletesOverrides as jest.Mock).mockResolvedValue({ athleteData: {} }) // No overrides for this test
    ;(mockData.get.athletesCategories as jest.Mock).mockResolvedValue(baseMockAthleteCategories)
    ;(mockData.get.rawEventAthletes as jest.Mock).mockResolvedValue(rawEventAthletes)
    ;(mockData.update.baseAthletes as jest.Mock).mockResolvedValue(undefined)

    const result = await cleanAthletes({ year: 2023, eventHashes: ['event1'] })

    expect(result).toEqual(['12345678902']) // Only new athlete ID returned
    expect(mockData.get.baseAthletes).toHaveBeenCalled()
    expect(mockData.get.rawEventAthletes).toHaveBeenCalledWith('event1', 2023)

    // Check that full Athlete objects are passed
    expect(mockData.update.baseAthletes).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          // Existing athlete with applied categories (overrides are commented out in actual implementation)
          uciId: '12345678901',
          firstName: 'John',
          lastName: 'Doe',
          gender: 'M',
          city: 'Toronto', // Should remain unchanged since overrides are not applied
          province: 'ON',
          birthYear: 1990,
          licenses: { 2023: ['ABC123'] },
          nationality: 'CAN',
          lastUpdated: '2023-06-15',
          skillLevel: { ROAD: '1' }, // Applied from baseMockAthleteCategories
          ageCategory: { ROAD: 'ELITE' } // Applied from baseMockAthleteCategories - case sensitive!
        }),
        expect.objectContaining({
          // New athlete as-is (converted from raw to clean)
          uciId: '12345678902',
          firstName: 'Jane',
          lastName: 'Smith',
          gender: 'F',
          city: 'Vancouver',
          province: 'BC',
          birthYear: 1985,
          licenses: { 2023: ['DEF456'] },
          nationality: 'CAN',
          lastUpdated: '2023-07-20'
        })
      ])
    )
  })

  it('should reconcile existing athlete profiles with new data', async () => {
    const existingAthlete: Athlete = {
      ...baseMockCleanAthlete,
      city: 'Toronto',
      lastUpdated: '2023-06-15'
    }

    const updatedRawAthlete = {
        ...baseMockCleanAthlete,
        city: 'Montreal',
        province: 'QC',
        lastUpdated: '2023-07-20' // Newer date
      }

    ;(mockData.get.baseAthletes as jest.Mock).mockResolvedValue([existingAthlete])
    ;(mockData.get.athletesOverrides as jest.Mock).mockResolvedValue({ athleteData: {} })
    ;(mockData.get.athletesCategories as jest.Mock).mockResolvedValue([])
    ;(mockData.get.rawEventAthletes as jest.Mock).mockResolvedValue([updatedRawAthlete])
    ;(mockData.update.baseAthletes as jest.Mock).mockResolvedValue(undefined)

    const result = await cleanAthletes({ year: 2023, eventHashes: ['event1'] })

    expect(result).toEqual(['12345678901'])
    expect(mockData.update.baseAthletes).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          uciId: '12345678901',
          city: 'Montreal',
          province: 'QC',
          lastUpdated: '2023-07-20'
        })
      ])
    )
  })

  it('should not update athlete with older lastUpdated date', async () => {
    const existingAthlete: Athlete = {
      ...baseMockCleanAthlete,
      city: 'Toronto',
      lastUpdated: '2023-07-20'
    }

    const olderRawAthlete = {
        ...baseMockCleanAthlete,
        city: 'Montreal',
        lastUpdated: '2023-06-15' // Older date
      }

    ;(mockData.get.baseAthletes as jest.Mock).mockResolvedValue([existingAthlete])
    ;(mockData.get.athletesOverrides as jest.Mock).mockResolvedValue({ athleteData: {} })
    ;(mockData.get.athletesCategories as jest.Mock).mockResolvedValue([])
    ;(mockData.get.rawEventAthletes as jest.Mock).mockResolvedValue([olderRawAthlete])
    ;(mockData.update.baseAthletes as jest.Mock).mockResolvedValue(undefined)

    await cleanAthletes({ year: 2023, eventHashes: ['event1'] })

    expect(mockData.update.baseAthletes).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          uciId: '12345678901',
          city: 'Toronto', // Should remain unchanged
          lastUpdated: '2023-07-20'
        })
      ])
    )
  })

  it('should merge licenses from multiple events', async () => {
    const existingAthlete: Athlete = {
      ...baseMockCleanAthlete,
      licenses: { 2023: ['ABC123'] }
    }

    const rawAthleteWithNewLicense = {
        ...baseMockCleanAthlete,
        licenses: { 2023: ['XYZ789'] }
      }

    ;(mockData.get.baseAthletes as jest.Mock).mockResolvedValue([existingAthlete])
    ;(mockData.get.athletesOverrides as jest.Mock).mockResolvedValue({ athleteData: {} })
    ;(mockData.get.athletesCategories as jest.Mock).mockResolvedValue([])
    ;(mockData.get.rawEventAthletes as jest.Mock).mockResolvedValue([rawAthleteWithNewLicense])
    ;(mockData.update.baseAthletes as jest.Mock).mockResolvedValue(undefined)

    await cleanAthletes({ year: 2023, eventHashes: ['event1'] })

    expect(mockData.update.baseAthletes).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          uciId: '12345678901',
          licenses: { 2023: ['ABC123', 'XYZ789'] }
        })
      ])
    )
  })

  it('should apply skill levels and age categories from athlete categories', async () => {
    const athleteWithoutCategories: Athlete = {
      ...baseMockCleanAthlete,
      skillLevel: undefined,
      ageCategory: undefined
    }

    const athleteCategories: AthleteSkillCategory[] = [
        {
          athleteUciId: '12345678901',
          skillLevels: {
            ROAD: {
              '2023-01-01': '1',
              '2022-01-01': '2'
            }
          },
          ageCategory: 'ELITE'
        }
      ]

    ;(mockData.get.baseAthletes as jest.Mock).mockResolvedValue([athleteWithoutCategories])
    ;(mockData.get.athletesOverrides as jest.Mock).mockResolvedValue({ athleteData: {} })
    ;(mockData.get.athletesCategories as jest.Mock).mockResolvedValue(athleteCategories)
    ;(mockData.get.rawEventAthletes as jest.Mock).mockResolvedValue([])
    ;(mockData.update.baseAthletes as jest.Mock).mockResolvedValue(undefined)

    await cleanAthletes({ year: 2023, eventHashes: ['event1'] })

    expect(mockData.update.baseAthletes).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          uciId: '12345678901',
          skillLevel: { ROAD: '1' }, // Most recent skill level
          ageCategory: { ROAD: 'ELITE' } // Case sensitive - should be 'ELITE', not 'elite'
        })
      ])
    )
  })

  it('should NOT apply athlete data overrides (feature is disabled)', async () => {
    const athlete: Athlete = { ...baseMockCleanAthlete }
    const overrides = {
        athleteData: {
          '12345678901': {
            city: 'Ottawa',
            province: 'ON'
          }
        }
      }

    ;(mockData.get.baseAthletes as jest.Mock).mockResolvedValue([athlete])
    ;(mockData.get.athletesOverrides as jest.Mock).mockResolvedValue(overrides)
    ;(mockData.get.athletesCategories as jest.Mock).mockResolvedValue([])
    ;(mockData.get.rawEventAthletes as jest.Mock).mockResolvedValue([])
    ;(mockData.update.baseAthletes as jest.Mock).mockResolvedValue(undefined)

    await cleanAthletes({ year: 2023, eventHashes: ['event1'] })

    // Overrides should NOT be applied since the feature is commented out in the implementation
    expect(mockData.update.baseAthletes).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          uciId: '12345678901',
          city: 'Toronto', // Should remain unchanged - overrides are not applied
          province: 'ON'   // Should remain unchanged - overrides are not applied
        })
      ])
    )
  })

  it('should handle multiple events successfully', async () => {
    const existingAthletes = [baseMockCleanAthlete]
    const rawAthlete1 = { ...baseMockRawAthlete, uciId: '12345678903' }
    const rawAthlete2 = { ...baseMockRawAthlete, uciId: '12345678904' }

    ;(mockData.get.baseAthletes as jest.Mock).mockResolvedValue(existingAthletes)
    ;(mockData.get.athletesOverrides as jest.Mock).mockResolvedValue({ athleteData: {} })
    ;(mockData.get.athletesCategories as jest.Mock).mockResolvedValue([])
    ;(mockData.get.rawEventAthletes as jest.Mock)
    .mockResolvedValueOnce([rawAthlete1])
    .mockResolvedValueOnce([rawAthlete2])
    ;(mockData.update.baseAthletes as jest.Mock).mockResolvedValue(undefined)

    const result = await cleanAthletes({ year: 2023, eventHashes: ['event1', 'event2'] })

    expect(result).toEqual(['12345678903', '12345678904'])
    expect(mockData.get.rawEventAthletes).toHaveBeenCalledTimes(2)
    expect(mockData.get.rawEventAthletes).toHaveBeenCalledWith('event1', 2023)
    expect(mockData.get.rawEventAthletes).toHaveBeenCalledWith('event2', 2023)
  })

  it('should handle errors during athlete saving gracefully', async () => {
    const existingAthletes = [baseMockCleanAthlete]
    const saveError = new Error('Database save failed')

    ;(mockData.get.baseAthletes as jest.Mock).mockResolvedValue(existingAthletes)
    ;(mockData.get.athletesOverrides as jest.Mock).mockResolvedValue({ athleteData: {} })
    ;(mockData.get.athletesCategories as jest.Mock).mockResolvedValue([])
    ;(mockData.get.rawEventAthletes as jest.Mock).mockResolvedValue([])
    ;(mockData.update.baseAthletes as jest.Mock).mockRejectedValue(saveError)

    // Should not throw, error should be handled gracefully
    const result = await cleanAthletes({ year: 2023, eventHashes: ['event1'] })

    expect(result).toEqual([])
    expect(mockData.update.baseAthletes).toHaveBeenCalled()
  })

  it('should handle athletes with no category information', async () => {
    const athlete: Athlete = { ...baseMockCleanAthlete }

    ;(mockData.get.baseAthletes as jest.Mock).mockResolvedValue([athlete])
    ;(mockData.get.athletesOverrides as jest.Mock).mockResolvedValue({ athleteData: {} })
    ;(mockData.get.athletesCategories as jest.Mock).mockResolvedValue([]) // Empty categories
    ;(mockData.get.rawEventAthletes as jest.Mock).mockResolvedValue([])
    ;(mockData.update.baseAthletes as jest.Mock).mockResolvedValue(undefined)

    await cleanAthletes({ year: 2023, eventHashes: ['event1'] })

    expect(mockData.update.baseAthletes).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          uciId: '12345678901'
          // Should not have skillLevel or ageCategory added
        })
      ])
    )
  })

  it('should populate null fields with new non-null values', async () => {
    const existingAthlete: Athlete = {
      ...baseMockCleanAthlete,
      city: null,
      province: null
    }

    const rawAthleteWithData = {
        ...baseMockCleanAthlete,
        city: 'Vancouver',
        province: 'BC'
      }

    ;(mockData.get.baseAthletes as jest.Mock).mockResolvedValue([existingAthlete])
    ;(mockData.get.athletesOverrides as jest.Mock).mockResolvedValue({ athleteData: {} })
    ;(mockData.get.athletesCategories as jest.Mock).mockResolvedValue([])
    ;(mockData.get.rawEventAthletes as jest.Mock).mockResolvedValue([rawAthleteWithData])
    ;(mockData.update.baseAthletes as jest.Mock).mockResolvedValue(undefined)

    await cleanAthletes({ year: 2023, eventHashes: ['event1'] })

    expect(mockData.update.baseAthletes).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          uciId: '12345678901',
          city: 'Vancouver',
          province: 'BC'
        })
      ])
    )
  })

  it('should handle UCI ID replacement when configured', async () => {
    const existingAthlete: Athlete = {
      ...baseMockCleanAthlete,
      uciId: '12345678999' // New UCI ID
    }

    const rawAthleteWithOldId = {
      ...baseMockRawAthlete,
      uciId: '12345678901', // Old UCI ID
      firstName: 'John',
      lastName: 'Doe'
    }

    const overrides = {
        replacedUciIds: {
          '12345678901': {
            old: '12345678901',
            new: '12345678999',
            name: 'John Doe'
          }
        }
      }

    ;(mockData.get.baseAthletes as jest.Mock).mockResolvedValue([existingAthlete])
    ;(mockData.get.athletesOverrides as jest.Mock).mockResolvedValue(overrides)
    ;(mockData.get.athletesCategories as jest.Mock).mockResolvedValue([])
    ;(mockData.get.rawEventAthletes as jest.Mock).mockResolvedValue([rawAthleteWithOldId])
    ;(mockData.update.baseAthletes as jest.Mock).mockResolvedValue(undefined)

    const result = await cleanAthletes({ year: 2023, eventHashes: ['event1'] })

    // Should return the NEW UCI ID, not the old one
    expect(result).toEqual(['12345678999'])

    // Should update the existing athlete profile with data from raw athlete
    expect(mockData.update.baseAthletes).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          uciId: '12345678999' // Should use the new UCI ID
        })
      ])
    )
  })

  it('should handle athletes with duplicate UCI IDs within same event', async () => {
    const existingAthletes: Athlete[] = []

    // Two raw athletes with same UCI ID (should not happen but implementation handles it)
    const rawAthlete1 = { ...baseMockRawAthlete, firstName: 'John', lastName: 'Doe' }
    const rawAthlete2 = { ...baseMockRawAthlete, firstName: 'Jane', lastName: 'Smith' } // Same UCI ID

    ;(mockData.get.baseAthletes as jest.Mock).mockResolvedValue(existingAthletes)
    ;(mockData.get.athletesOverrides as jest.Mock).mockResolvedValue({ athleteData: {} })
    ;(mockData.get.athletesCategories as jest.Mock).mockResolvedValue([])
    ;(mockData.get.rawEventAthletes as jest.Mock).mockResolvedValue([rawAthlete1, rawAthlete2])
    ;(mockData.update.baseAthletes as jest.Mock).mockResolvedValue(undefined)

    const result = await cleanAthletes({ year: 2023, eventHashes: ['event1'] })

    // Should return the UCI ID only once due to Set usage (implementation uses Set now)
    expect(result).toEqual(['12345678902'])

    // Should save the last processed athlete with that UCI ID
    expect(mockData.update.baseAthletes).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          uciId: '12345678902',
          firstName: 'Jane', // Last one wins
          lastName: 'Smith'
        })
      ])
    )
  })

  it('should handle event fetch errors gracefully', async () => {
    const existingAthletes = [baseMockCleanAthlete]
    const fetchError = new Error('Failed to fetch event athletes')

    ;(mockData.get.baseAthletes as jest.Mock).mockResolvedValue(existingAthletes)
    ;(mockData.get.athletesOverrides as jest.Mock).mockResolvedValue({ athleteData: {} })
    ;(mockData.get.athletesCategories as jest.Mock).mockResolvedValue([])
    ;(mockData.get.rawEventAthletes as jest.Mock).mockRejectedValue(fetchError)
    ;(mockData.update.baseAthletes as jest.Mock).mockResolvedValue(undefined)

    // Should not throw, error should be handled gracefully
    const result = await cleanAthletes({ year: 2023, eventHashes: ['event1', 'event2'] })

    // Should continue processing other events and existing athletes
    expect(result).toEqual([])
    expect(mockData.update.baseAthletes).toHaveBeenCalled()
  })

  it('should handle missing athlete categories gracefully', async () => {
    const athlete: Athlete = { ...baseMockCleanAthlete }

    ;(mockData.get.baseAthletes as jest.Mock).mockResolvedValue([athlete])
    ;(mockData.get.athletesOverrides as jest.Mock).mockResolvedValue({ athleteData: {} })
    ;(mockData.get.athletesCategories as jest.Mock).mockResolvedValue([]) // Empty array
    ;(mockData.get.rawEventAthletes as jest.Mock).mockResolvedValue([])
    ;(mockData.update.baseAthletes as jest.Mock).mockResolvedValue(undefined)

    // Should not throw error
    await expect(cleanAthletes({ year: 2023, eventHashes: ['event1'] })).resolves.toBeDefined()
  })

  it('should prevent duplicate license entries', async () => {
    const existingAthlete: Athlete = {
      ...baseMockCleanAthlete,
      licenses: { 2023: ['ABC123'] }
    }

    const rawAthleteWithSameLicense = {
        ...baseMockCleanAthlete,
        licenses: { 2023: ['ABC123'] } // Same license
      }

    ;(mockData.get.baseAthletes as jest.Mock).mockResolvedValue([existingAthlete])
    ;(mockData.get.athletesOverrides as jest.Mock).mockResolvedValue({ athleteData: {} })
    ;(mockData.get.athletesCategories as jest.Mock).mockResolvedValue([])
    ;(mockData.get.rawEventAthletes as jest.Mock).mockResolvedValue([rawAthleteWithSameLicense])
    ;(mockData.update.baseAthletes as jest.Mock).mockResolvedValue(undefined)

    await cleanAthletes({ year: 2023, eventHashes: ['event1'] })

    expect(mockData.update.baseAthletes).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          uciId: '12345678901',
          licenses: { 2023: ['ABC123'] } // Should not be duplicated
        })
      ])
    )
  })

  it('should preserve existing lastUpdated when new data is older', async () => {
    const existingAthlete: Athlete = {
      ...baseMockCleanAthlete,
      city: 'Toronto',
      lastUpdated: '2023-07-20'
    }

    const olderRawAthlete = {
        ...baseMockCleanAthlete,
        city: 'Montreal',
        lastUpdated: '2023-06-15' // Older date
      }

    ;(mockData.get.baseAthletes as jest.Mock).mockResolvedValue([existingAthlete])
    ;(mockData.get.athletesOverrides as jest.Mock).mockResolvedValue({ athleteData: {} })
    ;(mockData.get.athletesCategories as jest.Mock).mockResolvedValue([])
    ;(mockData.get.rawEventAthletes as jest.Mock).mockResolvedValue([olderRawAthlete])
    ;(mockData.update.baseAthletes as jest.Mock).mockResolvedValue(undefined)

    await cleanAthletes({ year: 2023, eventHashes: ['event1'] })

    expect(mockData.update.baseAthletes).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          uciId: '12345678901',
          city: 'Toronto', // Should remain unchanged due to older date
          lastUpdated: '2023-07-20' // Should keep existing date
        })
      ])
    )
  })
})