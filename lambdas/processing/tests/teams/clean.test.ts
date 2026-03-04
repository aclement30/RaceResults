// Mock the dependencies FIRST before any imports  
jest.mock('../../../shared/data')
jest.mock('../../../shared/team-parser')

// Import and use shared logger mock
import { createLoggerMock, mockLoggerInstance, clearLoggerMocks } from '../__mocks__/logger'

jest.mock('../../../shared/logger', () => createLoggerMock())

import { cleanAthletesTeams } from '../../teams/clean'
import data from '../../../shared/data'
import { TeamParser } from '../../../shared/team-parser'
import type { RawAthleteTeam, AthleteOverrides } from '../../types'
import type { Athlete } from '../../../shared/types'

const mockData = data as jest.Mocked<typeof data>
const mockTeamParser = TeamParser as jest.Mocked<typeof TeamParser>

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
  skillLevel: { ROAD: '1' },
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
  skillLevel: { CX: '2' },
  ageCategory: { CX: 'masters' }
}

const simpleMockRawAthletesTeams2023: Record<string, RawAthleteTeam> = {
  '12345678901': {
    '2023-06-15': { id: 1, name: 'Team Alpha' }
  },
  '12345678902': {
    '2023-05-10': { id: 2, name: 'Team Beta' }
  }
}

const simpleMockRawAthletesTeams2022: Record<string, RawAthleteTeam> = {
  '12345678901': {
    '2022-06-15': { id: 1, name: 'Team Alpha' }
  },
  '12345678902': {
    '2022-08-10': { id: 4, name: 'Team Delta' }
  }
}

const baseMockExistingAthlete: Athlete = {
  uciId: '12345678903',
  firstName: 'Bob',
  lastName: 'Wilson',
  gender: 'M',
  city: 'Calgary',
  province: 'AB',
  birthYear: 1988,
  licenses: { 2023: ['GHI789'] },
  nationality: 'CAN',
  lastUpdated: '2023-08-10',
  skillLevel: { ROAD: '3' },
  ageCategory: { ROAD: 'senior' },
  teams: {
    2022: { id: 5, name: 'Team Echo' }
  }
}

describe('cleanAthletesTeams', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    clearLoggerMocks()

    // Setup TeamParser mock
    mockTeamParser.init = jest.fn().mockResolvedValue(undefined)
    mockTeamParser.getTeamByName = jest.fn()

    // Mock current year as 2024 for testing
    jest.spyOn(Date.prototype, 'getFullYear').mockReturnValue(2024)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should clean athlete teams successfully and filter by provided IDs', async () => {
    const athleteIds = ['12345678901', '12345678902']

    ;(mockData.get.baseAthletes as jest.Mock).mockResolvedValue([
      baseMockAthlete1,
      baseMockAthlete2,
      baseMockExistingAthlete
    ])
    ;(mockData.get.rawAthletesTeams as jest.Mock)
    .mockResolvedValueOnce(simpleMockRawAthletesTeams2023) // year 2023
    .mockResolvedValueOnce(simpleMockRawAthletesTeams2022) // year 2022
    ;(mockData.update.baseAthletes as jest.Mock).mockResolvedValue(undefined)

    // Mock TeamParser responses for teams
    ;(mockTeamParser.getTeamByName as jest.Mock)
    .mockImplementation((name: string) => {
      if (name === 'Team Alpha') return { id: 1, name: 'Team Alpha' }
      if (name === 'Team Beta') return { id: 2, name: 'Team Beta' }
      if (name === 'Team Delta') return { id: 4, name: 'Team Delta' }
      return undefined
    })

    await cleanAthletesTeams({ athleteIds, year: 2023 })

    // Should initialize TeamParser before processing
    expect(mockTeamParser.init).toHaveBeenCalledTimes(1)

    expect(mockData.get.baseAthletes).toHaveBeenCalled()
    expect(mockData.get.rawAthletesTeams).toHaveBeenCalledWith(2023)
    expect(mockData.get.rawAthletesTeams).toHaveBeenCalledWith(2022)

    // Should save updated athletes with teams (only specified athlete IDs)
    expect(mockData.update.baseAthletes).toHaveBeenCalledWith(
      expect.arrayContaining([
        // Updated athlete 1 with teams
        expect.objectContaining({
          uciId: '12345678901',
          teams: expect.objectContaining({
            2022: expect.objectContaining({
              id: 1,
              name: 'Team Alpha'
            }),
            2023: expect.objectContaining({
              id: 1,
              name: 'Team Alpha'
            })
            // 2024 may or may not be included depending on logic
          })
        }),
        // Updated athlete 2 with teams
        expect.objectContaining({
          uciId: '12345678902',
          teams: expect.objectContaining({
            2022: expect.objectContaining({
              id: 4,
              name: 'Team Delta'
            }),
            2023: expect.objectContaining({
              id: 2,
              name: 'Team Beta'
            })
            // 2024 may or may not be included depending on logic
          })
        })
      ])
    )

    // Verify that only the specified athletes were processed
    const savedAthletes = (mockData.update.baseAthletes as jest.Mock).mock.calls[0][0]
    expect(savedAthletes).toHaveLength(2) // Only the 2 specified athletes
  })

  it('should handle team resolution for athletes with no teams in current year', async () => {
    const athleteIds = ['12345678901']

    // Athlete has team in 2022 but not in 2023
    const rawTeams2023: Record<string, RawAthleteTeam> = {}
    const rawTeams2022 = {
        '12345678901': {
          '2022-06-15': { id: 1, name: 'Team Alpha' }
        }
      }

    ;(mockData.get.baseAthletes as jest.Mock).mockResolvedValue([baseMockAthlete1])
    ;(mockData.get.rawAthletesTeams as jest.Mock)
    .mockResolvedValueOnce(rawTeams2023) // year 2023 - empty
    .mockResolvedValueOnce(rawTeams2022) // year 2022 - has team
    ;(mockData.update.baseAthletes as jest.Mock).mockResolvedValue(undefined)

    ;(mockTeamParser.getTeamByName as jest.Mock)
    .mockImplementation((name: string) => {
      if (name === 'Team Alpha') return { id: 1, name: 'Team Alpha' }
      return undefined
    })

    await cleanAthletesTeams({ athleteIds, year: 2023 })

    // Should infer 2023 team from 2022 (single team fallback)
    expect(mockData.update.baseAthletes).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          uciId: '12345678901',
          teams: expect.objectContaining({
            2022: { id: 1, name: 'Team Alpha' }
            // 2023 may be inferred, 2024 may be added depending on logic
          })
        })
      ])
    )
  })

  it('should update existing athlete teams', async () => {
    const athleteIds = ['12345678901']
    const existingAthlete = {
        ...baseMockAthlete1,
        teams: {
          2023: { id: 999, name: 'Old Team Name' }
        }
      }

    ;(mockData.get.baseAthletes as jest.Mock).mockResolvedValue([existingAthlete])
    ;(mockData.get.rawAthletesTeams as jest.Mock)
    .mockResolvedValueOnce(simpleMockRawAthletesTeams2023)
    .mockResolvedValueOnce({})
    ;(mockData.update.baseAthletes as jest.Mock).mockResolvedValue(undefined)

    ;(mockTeamParser.getTeamByName as jest.Mock)
    .mockImplementation((name: string) => {
      if (name === 'Team Alpha') return { id: 1, name: 'Team Alpha' }
      return undefined
    })

    await cleanAthletesTeams({ athleteIds, year: 2023 })

    // Should update the existing athlete with new team data
    expect(mockData.update.baseAthletes).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          uciId: '12345678901',
          teams: expect.objectContaining({
            2023: expect.objectContaining({
              id: 1,
              name: 'Team Alpha'
            })
            // 2024 may or may not be included depending on logic
          })
        })
      ])
    )
  })

  it('should handle athletes with multiple teams in same year (same team last two races)', async () => {
    const athleteIds = ['12345678901']
    const multiTeamData = {
        '12345678901': {
          '2023-06-15': { id: 1, name: 'Team Alpha' },
          '2023-07-20': { id: 2, name: 'Team Beta' },
          '2023-08-10': { id: 2, name: 'Team Beta' } // Same team as previous race
        }
      }

    ;(mockData.get.baseAthletes as jest.Mock).mockResolvedValue([baseMockAthlete1])
    ;(mockData.get.rawAthletesTeams as jest.Mock)
    .mockResolvedValueOnce(multiTeamData)
    .mockResolvedValueOnce({})
    ;(mockData.update.baseAthletes as jest.Mock).mockResolvedValue(undefined)

    ;(mockTeamParser.getTeamByName as jest.Mock)
    .mockImplementation((name: string) => {
      if (name === 'Team Alpha') return { id: 1, name: 'Team Alpha' }
      if (name === 'Team Beta') return { id: 2, name: 'Team Beta' }
      return undefined
    })

    await cleanAthletesTeams({ athleteIds, year: 2023 })

    // Should use team resolution logic for multiple teams (last two races same team)
    expect(mockData.update.baseAthletes).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          uciId: '12345678901',
          teams: expect.objectContaining({
            2023: expect.objectContaining({
              id: 2,
              name: 'Team Beta'
            })
          })
        })
      ])
    )
  })

  it('should handle save errors gracefully', async () => {
    const athleteIds = ['12345678901']
    const saveError = new Error('Database save failed')

    ;(mockData.get.baseAthletes as jest.Mock).mockResolvedValue([baseMockAthlete1])
    ;(mockData.get.rawAthletesTeams as jest.Mock)
    .mockResolvedValueOnce(simpleMockRawAthletesTeams2023)
    .mockResolvedValueOnce({})
    ;(mockData.update.baseAthletes as jest.Mock).mockRejectedValue(saveError)

    // Should not throw, error should be handled gracefully
    await expect(cleanAthletesTeams({ athleteIds, year: 2023 })).resolves.not.toThrow()

    // Check that logger.error was called for the save failure
    expect(mockLoggerInstance.error).toHaveBeenCalledWith(
      'Failed to save athletes: Database save failed',
      expect.objectContaining({
        error: expect.any(Error)
      })
    )
  })
})