// Mock the dependencies FIRST before any imports  
jest.mock('../../../shared/data')
jest.mock('../../../shared/team-parser')

// Import and use shared logger mock
import { createLoggerMock, mockLoggerInstance, clearLoggerMocks } from '../__mocks__/logger'

jest.mock('../../../shared/logger', () => createLoggerMock())

import { extractAthletesTeams } from '../../teams/extract'
import data from '../../../shared/data'
import { TeamParser } from '../../../shared/team-parser'
import type { RawAthleteTeam } from '../../types'
import type { CleanAthleteRaceResult } from '../../types'

const mockData = data as jest.Mocked<typeof data>
const mockTeamParser = TeamParser as jest.Mocked<typeof TeamParser>

// Base mock data for reuse
const baseMockRaceResult1: CleanAthleteRaceResult = {
  athleteUciId: '12345678901',
  teamName: 'Team Alpha',
  date: '2023-06-15',
  eventHash: 'event1',
  eventType: 'A',
  discipline: 'ROAD',
  category: 'Cat1',
  position: 1,
  status: 'FINISHER',
  upgradePoints: 10,
  fieldSize: 50
}

const baseMockRaceResult2: CleanAthleteRaceResult = {
  athleteUciId: '12345678902',
  teamName: 'Team Beta',
  date: '2023-07-20',
  eventHash: 'event2',
  eventType: 'AA',
  discipline: 'CX',
  category: 'Cat2',
  position: 2,
  status: 'FINISHER',
  upgradePoints: 8,
  fieldSize: 30
}

const baseMockRaceResultNoTeam: CleanAthleteRaceResult = {
  athleteUciId: '12345678903',
  teamName: undefined,
  date: '2023-08-10',
  eventHash: 'event3',
  eventType: 'GRASSROOTS',
  discipline: 'ROAD',
  category: 'Cat3',
  position: 5,
  status: 'FINISHER',
  upgradePoints: 4,
  fieldSize: 25
}

const baseMockRaceResultUnknownTeam: CleanAthleteRaceResult = {
  athleteUciId: '12345678904',
  teamName: 'Unknown Team XYZ',
  date: '2023-09-05',
  eventHash: 'event4',
  eventType: 'GRASSROOTS',
  discipline: 'CX',
  category: 'Cat4',
  position: 3,
  status: 'FINISHER',
  upgradePoints: 6,
  fieldSize: 40
}

// Mock teams
const mockTeamAlpha = {
  id: 1,
  name: 'Team Alpha',
  city: 'Toronto',
  alternateNames: ['Alpha Team'],
  uniqueKeywords: ['alpha']
}

const mockTeamBeta = {
  id: 2,
  name: 'Team Beta',
  city: 'Vancouver',
  alternateNames: ['Beta Team'],
  uniqueKeywords: ['beta']
}

const baseMockExistingTeams: Record<string, RawAthleteTeam> = {
  '12345678901': {
    '2023-01-15': { id: 1, name: 'Team Alpha' },
    '2023-02-20': { name: 'Old Team Name' }
  }
}

describe('extractAthletesTeams', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    clearLoggerMocks()

    // Setup TeamParser mock - ensure clean state
    mockTeamParser.init = jest.fn().mockResolvedValue(undefined)
    mockTeamParser.getTeamByName = jest.fn()
  })

  it('should extract athlete teams from race results successfully', async () => {
    const raceResults = [baseMockRaceResult1, baseMockRaceResult2]

    ;(mockData.get.rawAthletesTeams as jest.Mock).mockResolvedValue({})
    ;(mockData.get.athletesRacesResults as jest.Mock).mockResolvedValue(raceResults)
    ;(mockData.update.rawAthletesTeams as jest.Mock).mockResolvedValue(undefined)

    ;(mockTeamParser.getTeamByName as jest.Mock)
    .mockReturnValueOnce(mockTeamAlpha)
    .mockReturnValueOnce(mockTeamBeta)

    await extractAthletesTeams({ year: 2023, eventHashes: ['event1'] })

    // Should initialize TeamParser before processing
    expect(mockTeamParser.init).toHaveBeenCalledTimes(1)

    expect(mockData.update.rawAthletesTeams).toHaveBeenCalledWith(
      {
        '12345678901': {
          '2023-06-15': { id: 1, name: 'Team Alpha' }
        },
        '12345678902': {
          '2023-07-20': { id: 2, name: 'Team Beta' }
        }
      },
      { year: 2023 }
    )
  })

  it('should merge with existing raw athlete teams data', async () => {
    const raceResults = [baseMockRaceResult2]

    ;(mockData.get.rawAthletesTeams as jest.Mock).mockResolvedValue(baseMockExistingTeams)
    ;(mockData.get.athletesRacesResults as jest.Mock).mockResolvedValue(raceResults)
    ;(mockData.update.rawAthletesTeams as jest.Mock).mockResolvedValue(undefined)

    ;(mockTeamParser.getTeamByName as jest.Mock).mockReturnValue(mockTeamBeta)

    await extractAthletesTeams({ year: 2023, eventHashes: ['event1'] })

    expect(mockData.update.rawAthletesTeams).toHaveBeenCalledWith(
      {
        // Existing data should be preserved
        '12345678901': {
          '2023-01-15': { id: 1, name: 'Team Alpha' },
          '2023-02-20': { name: 'Old Team Name' }
        },
        // New data should be added
        '12345678902': {
          '2023-07-20': { id: 2, name: 'Team Beta' }
        }
      },
      { year: 2023 }
    )
  })

  it('should handle multiple event hashes', async () => {
    const event1Results = [baseMockRaceResult1]
    const event2Results = [baseMockRaceResult2]

    ;(mockData.get.rawAthletesTeams as jest.Mock).mockResolvedValue({})
    ;(mockData.get.athletesRacesResults as jest.Mock)
    .mockResolvedValueOnce(event1Results)
    .mockResolvedValueOnce(event2Results)
    ;(mockData.update.rawAthletesTeams as jest.Mock).mockResolvedValue(undefined)

    ;(mockTeamParser.getTeamByName as jest.Mock)
    .mockReturnValueOnce(mockTeamAlpha)
    .mockReturnValueOnce(mockTeamBeta)

    await extractAthletesTeams({ year: 2023, eventHashes: ['event1', 'event2'] })

    expect(mockData.get.athletesRacesResults).toHaveBeenCalledTimes(2)
    expect(mockData.get.athletesRacesResults).toHaveBeenCalledWith({ eventHash: 'event1', year: 2023 })
    expect(mockData.get.athletesRacesResults).toHaveBeenCalledWith({ eventHash: 'event2', year: 2023 })

    expect(mockData.update.rawAthletesTeams).toHaveBeenCalledWith(
      {
        '12345678901': {
          '2023-06-15': { id: 1, name: 'Team Alpha' }
        },
        '12345678902': {
          '2023-07-20': { id: 2, name: 'Team Beta' }
        }
      },
      { year: 2023 }
    )
  })

  it('should handle event extraction failures gracefully', async () => {
    const successfulResults = [baseMockRaceResult1]

    ;(mockData.get.rawAthletesTeams as jest.Mock).mockResolvedValue({})
    ;(mockData.get.athletesRacesResults as jest.Mock)
    .mockResolvedValueOnce(successfulResults)
    .mockRejectedValueOnce(new Error('Failed to get race results'))
    ;(mockData.update.rawAthletesTeams as jest.Mock).mockResolvedValue(undefined)

    ;(mockTeamParser.getTeamByName as jest.Mock).mockReturnValue(mockTeamAlpha)

    await extractAthletesTeams({ year: 2023, eventHashes: ['event1', 'event2'] })

    expect(mockData.update.rawAthletesTeams).toHaveBeenCalledWith(
      {
        '12345678901': {
          '2023-06-15': { id: 1, name: 'Team Alpha' }
        }
      },
      { year: 2023 }
    )

    // Check that logger.error was called for the failed event
    expect(mockLoggerInstance.error).toHaveBeenCalledWith(
      'Error while processing athlete teams from event results: Error: Failed to get race results',
      expect.objectContaining({
        hash: 'event2',
        year: 2023,
        error: expect.any(Error)
      })
    )
  })

  it('should handle save errors gracefully', async () => {
    const raceResults = [baseMockRaceResult1]
    const saveError = new Error('Database save failed')

    ;(mockData.get.rawAthletesTeams as jest.Mock).mockResolvedValue({})
    ;(mockData.get.athletesRacesResults as jest.Mock).mockResolvedValue(raceResults)
    ;(mockData.update.rawAthletesTeams as jest.Mock).mockRejectedValue(saveError)

    ;(mockTeamParser.getTeamByName as jest.Mock).mockReturnValue(mockTeamAlpha)

    // Should not throw, error should be handled gracefully
    await expect(extractAthletesTeams({ year: 2023, eventHashes: ['event1'] })).resolves.not.toThrow()

    // Check that logger.error was called for the save failure
    expect(mockLoggerInstance.error).toHaveBeenCalledWith(
      'Failed to save extracted teams: Database save failed',
      expect.objectContaining({
        error: expect.any(Error)
      })
    )
  })

  it('should handle teams not found in parser and mixed scenarios', async () => {
    const raceResults = [
        baseMockRaceResult1, // Team Alpha (found)
        baseMockRaceResultUnknownTeam, // Unknown Team XYZ (not found)
        baseMockRaceResultNoTeam // No team (should be skipped)
      ]

    ;(mockData.get.rawAthletesTeams as jest.Mock).mockResolvedValue({})
    ;(mockData.get.athletesRacesResults as jest.Mock).mockResolvedValue(raceResults)
    ;(mockData.update.rawAthletesTeams as jest.Mock).mockResolvedValue(undefined)

    ;(mockTeamParser.getTeamByName as jest.Mock)
    .mockReturnValueOnce(mockTeamAlpha) // Known team
    .mockReturnValueOnce(undefined)     // Unknown team

    await extractAthletesTeams({ year: 2023, eventHashes: ['event1'] })

    // Should call TeamParser for each team name (excluding null/undefined)
    expect(mockTeamParser.getTeamByName).toHaveBeenCalledTimes(2)
    expect(mockTeamParser.getTeamByName).toHaveBeenCalledWith('Team Alpha')
    expect(mockTeamParser.getTeamByName).toHaveBeenCalledWith('Unknown Team XYZ')

    expect(mockData.update.rawAthletesTeams).toHaveBeenCalledWith(
      {
        '12345678901': {
          '2023-06-15': { id: 1, name: 'Team Alpha' } // Known team with ID
        },
        '12345678904': {
          '2023-09-05': { name: 'Unknown Team XYZ' } // Unknown team without ID
        }
        // No entry for athlete with no team
      },
      { year: 2023 }
    )
  })
})