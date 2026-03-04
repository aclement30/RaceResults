// Mock the dependencies FIRST before any imports  
jest.mock('../../../shared/data')

// Import and use shared logger mock
import { createLoggerMock, mockLoggerInstance, clearLoggerMocks } from '../__mocks__/logger'

jest.mock('../../../shared/logger', () => createLoggerMock())

import { processAthletesUpgradeDates } from '../../upgrade-dates/process'
import data from '../../../shared/data'
import type { AthleteOverrides } from '../../types'
import type { Athlete, AthleteSkillCategory, AthleteUpgradeDate } from '../../../shared/types'

const mockData = data as jest.Mocked<typeof data>

// Base mock data for reuse
const baseMockAthlete1: Athlete = {
  uciId: '12345678901',
  firstName: 'John',
  lastName: 'Doe',
  gender: 'M',
  city: 'Toronto',
  province: 'ON',
  birthYear: 1990,
  licenses: { 2023: ['ABC123'] },
  nationality: 'CAN',
  lastUpdated: '2023-06-15',
  skillLevel: { ROAD: '2', CX: '3' },
  ageCategory: { ROAD: 'elite' }
}

const baseMockAthlete2: Athlete = {
  uciId: '12345678902',
  firstName: 'Jane',
  lastName: 'Smith',
  gender: 'F',
  city: 'Vancouver',
  province: 'BC',
  birthYear: 1985,
  licenses: { 2023: ['DEF456'] },
  nationality: 'CAN',
  lastUpdated: '2023-07-20',
  skillLevel: { ROAD: '1', CX: '4' },
  ageCategory: { CX: 'masters' }
}

const baseMockAthleteNoSkillLevel: Athlete = {
  uciId: '12345678903',
  firstName: 'Bob',
  lastName: 'Wilson',
  gender: 'M',
  city: 'Calgary',
  province: 'AB',
  birthYear: 1988,
  licenses: { 2023: ['GHI789'] },
  nationality: 'CAN',
  lastUpdated: '2023-08-10'
  // No skillLevel property
}

const baseMockAthleteCat5: Athlete = {
  uciId: '12345678904',
  firstName: 'Alice',
  lastName: 'Brown',
  gender: 'F',
  city: 'Montreal',
  province: 'QC',
  birthYear: 1992,
  licenses: { 2023: ['JKL012'] },
  nationality: 'CAN',
  lastUpdated: '2023-09-05',
  skillLevel: { ROAD: '5', CX: '5' },
  ageCategory: { ROAD: 'senior' }
}

const baseMockAthleteCategory1: AthleteSkillCategory = {
  athleteUciId: '12345678901',
  skillLevels: {
    ROAD: {
      '2023-01-15': '3',
      '2023-06-15': '2'
    },
    CX: {
      '2023-02-20': '4',
      '2023-07-10': '3'
    }
  },
  ageCategory: 'elite'
}

const baseMockAthleteCategory2: AthleteSkillCategory = {
  athleteUciId: '12345678902',
  skillLevels: {
    ROAD: {
      '2025-06-12': '2', // First record date (lower confidence)
      '2023-08-01': '1'
    }
  },
  ageCategory: 'masters'
}

const baseMockUpgradeDate1: AthleteUpgradeDate = {
  athleteUciId: '12345678901',
  discipline: 'ROAD',
  date: '2023-05-01',
  confidence: 0.9
}

const baseMockUpgradeDate2: AthleteUpgradeDate = {
  athleteUciId: '12345678902',
  discipline: 'CX',
  date: '2023-07-15',
  confidence: 0.7
}

const baseMockAthletesOverrides: AthleteOverrides = {
  alternateNames: {},
  replacedUciIds: {},
  levelUpgradeDates: {
    '12345678901': [
      { level: '2', date: '2023-04-01', discipline: 'ROAD' }
    ]
  },
  ignoredTeams: []
}

describe('processAthletesUpgradeDates', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    clearLoggerMocks()
  })

  it('should process athlete upgrade dates successfully and filter by provided IDs', async () => {
    const athleteIds = ['12345678901', '12345678902']

    ;(mockData.get.baseAthletes as jest.Mock).mockResolvedValue([
      baseMockAthlete1,
      baseMockAthlete2,
      baseMockAthleteNoSkillLevel
    ])
    ;(mockData.get.athletesCategories as jest.Mock).mockResolvedValue([
      baseMockAthleteCategory1,
      baseMockAthleteCategory2
    ])
    ;(mockData.get.athletesUpgradeDates as jest.Mock).mockResolvedValue([
      baseMockUpgradeDate1,
      baseMockUpgradeDate2
    ])
    ;(mockData.get.athletesOverrides as jest.Mock).mockResolvedValue(baseMockAthletesOverrides)
    ;(mockData.update.baseAthletes as jest.Mock).mockResolvedValue(undefined)

    await processAthletesUpgradeDates({ athleteIds })

    expect(mockData.get.baseAthletes).toHaveBeenCalled()
    expect(mockData.get.athletesCategories).toHaveBeenCalled()
    expect(mockData.get.athletesUpgradeDates).toHaveBeenCalled()
    expect(mockData.get.athletesOverrides).toHaveBeenCalled()

    // Should save updated athletes with upgrade dates (only specified athlete IDs)
    expect(mockData.update.baseAthletes).toHaveBeenCalledWith(
      expect.arrayContaining([
        // Athlete 1 with override date for ROAD only (CX continues processing)
        expect.objectContaining({
          uciId: '12345678901',
          latestUpgrade: expect.objectContaining({
            ROAD: expect.objectContaining({
              date: '2023-04-01',
              confidence: 1 // Override confidence
            })
            // CX should not be included due to override logic
          })
        }),
        // Athlete 2 with calculated dates
        expect.objectContaining({
          uciId: '12345678902',
          latestUpgrade: expect.objectContaining({
            ROAD: expect.objectContaining({
              date: '2025-06-12', // First record date (lower confidence)
              confidence: 0.4
            }),
            CX: expect.objectContaining({
              date: '2023-07-15', // From previous upgrade dates
              confidence: 0.7
            })
          })
        })
      ])
    )

    // Verify that only the specified athletes were processed
    const savedAthletes = (mockData.update.baseAthletes as jest.Mock).mock.calls[0][0]
    expect(savedAthletes).toHaveLength(2) // Only the 2 specified athletes
  })

  it('should handle athletes with overrides correctly', async () => {
    const athleteIds = ['12345678901']

    const overridesWithMultipleLevels: AthleteOverrides = {
        ...baseMockAthletesOverrides,
        levelUpgradeDates: {
          '12345678901': [
            { level: '2', date: '2023-04-01', discipline: 'ROAD' },
            { level: '3', date: '2023-03-15', discipline: 'CX' }
          ]
        }
      }

    ;(mockData.get.baseAthletes as jest.Mock).mockResolvedValue([baseMockAthlete1])
    ;(mockData.get.athletesCategories as jest.Mock).mockResolvedValue([baseMockAthleteCategory1])
    ;(mockData.get.athletesUpgradeDates as jest.Mock).mockResolvedValue([])
    ;(mockData.get.athletesOverrides as jest.Mock).mockResolvedValue(overridesWithMultipleLevels)
    ;(mockData.update.baseAthletes as jest.Mock).mockResolvedValue(undefined)

    await processAthletesUpgradeDates({ athleteIds })

    const savedAthletes = (mockData.update.baseAthletes as jest.Mock).mock.calls[0][0]
    const athlete = savedAthletes[0]

    // Should use override dates with confidence 1
    expect(athlete.latestUpgrade).toEqual({
      ROAD: { date: '2023-04-01', confidence: 1 },
      CX: { date: '2023-03-15', confidence: 1 }
    })
  })

  it('should handle first record date with lower confidence', async () => {
    const athleteIds = ['12345678902']

    const categoryWithFirstRecordDate: AthleteSkillCategory = {
        athleteUciId: '12345678902',
        skillLevels: {
          ROAD: {
            '2025-06-12': '2' // First record date (lower confidence)
          }
        },
        ageCategory: 'masters'
      }

    ;(mockData.get.baseAthletes as jest.Mock).mockResolvedValue([baseMockAthlete2])
    ;(mockData.get.athletesCategories as jest.Mock).mockResolvedValue([categoryWithFirstRecordDate])
    ;(mockData.get.athletesUpgradeDates as jest.Mock).mockResolvedValue([])
    ;(mockData.get.athletesOverrides as jest.Mock).mockResolvedValue({ levelUpgradeDates: {} })
    ;(mockData.update.baseAthletes as jest.Mock).mockResolvedValue(undefined)

    await processAthletesUpgradeDates({ athleteIds })

    const savedAthletes = (mockData.update.baseAthletes as jest.Mock).mock.calls[0][0]
    const athlete = savedAthletes[0]

    // Should use first record date with lower confidence
    expect(athlete.latestUpgrade.ROAD).toEqual({
      date: '2025-06-12',
      confidence: 0.4 // Lower confidence for first record
    })
  })

  it('should incorporate previous upgrade dates with existing confidence', async () => {
    const athleteIds = ['12345678902']

    ;(mockData.get.baseAthletes as jest.Mock).mockResolvedValue([baseMockAthlete2])
    ;(mockData.get.athletesCategories as jest.Mock).mockResolvedValue([baseMockAthleteCategory2])
    ;(mockData.get.athletesUpgradeDates as jest.Mock).mockResolvedValue([baseMockUpgradeDate2])
    ;(mockData.get.athletesOverrides as jest.Mock).mockResolvedValue({ levelUpgradeDates: {} })
    ;(mockData.update.baseAthletes as jest.Mock).mockResolvedValue(undefined)

    await processAthletesUpgradeDates({ athleteIds })

    const savedAthletes = (mockData.update.baseAthletes as jest.Mock).mock.calls[0][0]
    const athlete = savedAthletes[0]

    // Should include the previous upgrade date for CX
    expect(athlete.latestUpgrade.CX).toEqual({
      date: '2023-07-15',
      confidence: 0.7 // Original confidence from previous upgrade date
    })
  })

  it('should handle save errors gracefully', async () => {
    const athleteIds = ['12345678901']
    const saveError = new Error('Database save failed')

    ;(mockData.get.baseAthletes as jest.Mock).mockResolvedValue([baseMockAthlete1])
    ;(mockData.get.athletesCategories as jest.Mock).mockResolvedValue([])
    ;(mockData.get.athletesUpgradeDates as jest.Mock).mockResolvedValue([])
    ;(mockData.get.athletesOverrides as jest.Mock).mockResolvedValue({ levelUpgradeDates: {} })
    ;(mockData.update.baseAthletes as jest.Mock).mockRejectedValue(saveError)

    // Should not throw, error should be handled gracefully
    await expect(processAthletesUpgradeDates({ athleteIds })).resolves.not.toThrow()

    // Check that logger.error was called for the save failure
    expect(mockLoggerInstance.error).toHaveBeenCalledWith(
      'Failed to save athletes: Database save failed',
      expect.objectContaining({
        error: expect.any(Error)
      })
    )
  })

  it('should sort upgrade dates correctly and use the most recent', async () => {
    const athleteIds = ['12345678902']

    const categoryWithMultipleDates: AthleteSkillCategory = {
      athleteUciId: '12345678902',
      skillLevels: {
        ROAD: {
          '2023-01-15': '3',
          '2023-08-01': '1',
          '2023-05-10': '2'
        }
      },
      ageCategory: 'elite'
    }

    const olderUpgradeDate: AthleteUpgradeDate = {
        athleteUciId: '12345678902',
        discipline: 'ROAD',
        date: '2023-03-01',
        confidence: 0.6
      }

    ;(mockData.get.baseAthletes as jest.Mock).mockResolvedValue([baseMockAthlete2])
    ;(mockData.get.athletesCategories as jest.Mock).mockResolvedValue([categoryWithMultipleDates])
    ;(mockData.get.athletesUpgradeDates as jest.Mock).mockResolvedValue([olderUpgradeDate])
    ;(mockData.get.athletesOverrides as jest.Mock).mockResolvedValue({ levelUpgradeDates: {} })
    ;(mockData.update.baseAthletes as jest.Mock).mockResolvedValue(undefined)

    await processAthletesUpgradeDates({ athleteIds })

    const savedAthletes = (mockData.update.baseAthletes as jest.Mock).mock.calls[0][0]
    const athlete = savedAthletes[0]

    // Should use the most recent date (2023-08-01) from skill levels
    expect(athlete.latestUpgrade.ROAD).toEqual({
      date: '2023-08-01',
      confidence: 0.8
    })
  })
})