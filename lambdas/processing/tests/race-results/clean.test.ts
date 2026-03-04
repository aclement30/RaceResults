// Mock the dependencies FIRST before any imports  
jest.mock('../../../shared/data')

// Import and use shared logger mock
import { createLoggerMock, mockLoggerInstance, clearLoggerMocks } from '../__mocks__/logger'

jest.mock('../../../shared/logger', () => createLoggerMock())

// Mock AthleteFinder as a singleton instance
const mockFindAthleteUciId = jest.fn()
const mockInit = jest.fn().mockResolvedValue(undefined)

jest.mock('../../../shared/athlete-finder', () => ({
  AthleteFinder: {
    init: mockInit,
    findAthleteUciId: mockFindAthleteUciId
  }
}))

import { cleanRaceResults } from '../../race-results/clean'
import data from '../../../shared/data'
import type { RawAthleteRaceResult, CleanAthleteRaceResult } from '../../types'

const mockData = data as jest.Mocked<typeof data>

// Base mock data for reuse
const baseMockRawRaceResult1: RawAthleteRaceResult = {
  athleteUciId: '12345678901',
  firstName: 'John',
  lastName: 'Doe',
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

const baseMockRawRaceResult2: RawAthleteRaceResult = {
  athleteUciId: '12345678902',
  firstName: 'Jane',
  lastName: 'Smith',
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

const baseMockRaceResultNoUciId: RawAthleteRaceResult = {
  athleteUciId: '',
  firstName: 'Bob',
  lastName: 'Wilson',
  teamName: 'Team Gamma',
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

const baseMockInvalidUciId: RawAthleteRaceResult = {
  athleteUciId: 'invalid123',
  firstName: 'Unknown',
  lastName: 'Person',
  teamName: 'Team Delta',
  date: '2023-09-05',
  eventHash: 'event4',
  eventType: 'AAA',
  discipline: 'CX',
  category: 'Cat4',
  position: 3,
  status: 'FINISHER',
  upgradePoints: 6,
  fieldSize: 40
}

const createExpectedCleanRaceResult = (
  rawResult: RawAthleteRaceResult,
  overrides: Partial<CleanAthleteRaceResult> = {}
): CleanAthleteRaceResult => ({
  athleteUciId: rawResult.athleteUciId!,
  teamName: rawResult.teamName,
  date: rawResult.date,
  eventHash: rawResult.eventHash,
  eventType: rawResult.eventType,
  discipline: rawResult.discipline,
  category: rawResult.category,
  position: rawResult.position,
  status: rawResult.status,
  upgradePoints: rawResult.upgradePoints,
  fieldSize: rawResult.fieldSize,
  // firstName and lastName are omitted as per CleanAthleteRaceResult type
  ...overrides
})

describe('cleanRaceResults', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    clearLoggerMocks()

    // Reset AthleteFinder mocks
    mockFindAthleteUciId.mockReset()
  })

  it('should initialize AthleteFinder and clean race results with valid UCI IDs', async () => {
    const mockRawRaceResults = [baseMockRawRaceResult1, baseMockRawRaceResult2]

    ;(mockData.get.rawAthletesRaceResults as jest.Mock).mockResolvedValue(mockRawRaceResults)
    ;(mockData.update.athletesRacesResults as jest.Mock).mockResolvedValue(undefined)

    const result = await cleanRaceResults({ year: 2023, eventHashes: ['event1'] })

    // Should save cleaned results
    expect(mockData.update.athletesRacesResults).toHaveBeenCalledWith(
      expect.arrayContaining([
        createExpectedCleanRaceResult(baseMockRawRaceResult1),
        createExpectedCleanRaceResult(baseMockRawRaceResult2)
      ]),
      { year: 2023, eventHash: 'event1' }
    )

    // Should return athlete IDs
    expect(result.athleteIds).toEqual(expect.arrayContaining(['12345678901', '12345678902']))

    // Should log success with skip count
    expect(mockLoggerInstance.info).toHaveBeenCalledWith(
      'Saving 2 race results for event event1 (skipped: 0)...'
    )
  })

  it('should call AthleteFinder when UCI ID is missing but handle when no match is found', async () => {
    // Use undefined UCI ID instead of empty string to ensure it goes to name lookup
    const raceResultWithUndefinedUciId = {
      ...baseMockRaceResultNoUciId,
      athleteUciId: undefined
    }
    const mockRawRaceResults = [raceResultWithUndefinedUciId]

    // Mock AthleteFinder to return null (no match found)
    mockFindAthleteUciId.mockReturnValue(null)

    ;(mockData.get.rawAthletesRaceResults as jest.Mock).mockResolvedValue(mockRawRaceResults)
    ;(mockData.update.athletesRacesResults as jest.Mock).mockResolvedValue(undefined)

    const result = await cleanRaceResults({ year: 2023, eventHashes: ['event3'] })

    // Should call AthleteFinder with correct names
    expect(mockFindAthleteUciId).toHaveBeenCalledWith({
      firstName: 'Bob',
      lastName: 'Wilson'
    })

    // Should skip the result since no UCI ID could be resolved
    expect(mockData.update.athletesRacesResults).toHaveBeenCalledWith(
      [], // Empty array since no results could be resolved
      { year: 2023, eventHash: 'event3' }
    )

    // Should log with correct skip count
    expect(mockLoggerInstance.info).toHaveBeenCalledWith(
      'Saving 0 race results for event event3 (skipped: 1)...'
    )

    expect(result.athleteIds).toEqual([])
  })

  it('should skip race results that cannot be resolved and track skipped count', async () => {
    const mockRawRaceResults = [
      baseMockRawRaceResult1, // Valid UCI ID - should be included
      baseMockInvalidUciId,   // Invalid UCI ID, no name resolution - should be skipped
      baseMockRaceResultNoUciId // Empty UCI ID, no name resolution - should be skipped
    ]

    // Mock AthleteFinder to return null for unresolvable names
    mockFindAthleteUciId.mockReturnValue(null)

    ;(mockData.get.rawAthletesRaceResults as jest.Mock).mockResolvedValue(mockRawRaceResults)
    ;(mockData.update.athletesRacesResults as jest.Mock).mockResolvedValue(undefined)

    const result = await cleanRaceResults({ year: 2023, eventHashes: ['event1'] })

    // Should only save the valid result
    expect(mockData.update.athletesRacesResults).toHaveBeenCalledWith(
      [createExpectedCleanRaceResult(baseMockRawRaceResult1)],
      { year: 2023, eventHash: 'event1' }
    )

    // Should log with correct skip count (2 skipped)
    expect(mockLoggerInstance.info).toHaveBeenCalledWith(
      'Saving 1 race results for event event1 (skipped: 2)...'
    )

    expect(result.athleteIds).toEqual(['12345678901'])
  })

  it('should handle multiple event hashes in parallel', async () => {
    const event1Results = [baseMockRawRaceResult1]
    const event2Results = [baseMockRawRaceResult2]

    ;(mockData.get.rawAthletesRaceResults as jest.Mock)
    .mockResolvedValueOnce(event1Results)
    .mockResolvedValueOnce(event2Results)
    ;(mockData.update.athletesRacesResults as jest.Mock).mockResolvedValue(undefined)

    const result = await cleanRaceResults({ year: 2023, eventHashes: ['event1', 'event2'] })

    // Should process both events
    expect(mockData.get.rawAthletesRaceResults).toHaveBeenCalledTimes(2)
    expect(mockData.get.rawAthletesRaceResults).toHaveBeenCalledWith('event1', 2023)
    expect(mockData.get.rawAthletesRaceResults).toHaveBeenCalledWith('event2', 2023)

    expect(mockData.update.athletesRacesResults).toHaveBeenCalledTimes(2)

    // Should return unique athlete IDs from both events
    expect(result.athleteIds).toEqual(expect.arrayContaining(['12345678901', '12345678902']))
  })

  it('should handle event processing failures gracefully', async () => {
    const workingEvent = 'event1'
    const failingEvent = 'event2'

    ;(mockData.get.rawAthletesRaceResults as jest.Mock)
    .mockResolvedValueOnce([baseMockRawRaceResult1])
    .mockRejectedValueOnce(new Error('Failed to get race results'))
    ;(mockData.update.athletesRacesResults as jest.Mock).mockResolvedValue(undefined)

    const result = await cleanRaceResults({ year: 2023, eventHashes: [workingEvent, failingEvent] })

    // Should only include results from working event
    expect(result.athleteIds).toEqual(['12345678901'])

    // Should log error for failing event
    expect(mockLoggerInstance.error).toHaveBeenCalledWith(
      'Error while cleaning event race results: Error: Failed to get race results',
      expect.objectContaining({
        year: 2023,
        eventHash: failingEvent,
        error: expect.any(Error)
      })
    )
  })

  it('should handle save failures gracefully', async () => {
    const mockRawRaceResults = [baseMockRawRaceResult1]
    const saveError = new Error('Database save failed')

    ;(mockData.get.rawAthletesRaceResults as jest.Mock).mockResolvedValue(mockRawRaceResults)
    ;(mockData.update.athletesRacesResults as jest.Mock).mockRejectedValue(saveError)

    // Should not throw, should handle gracefully
    const result = await cleanRaceResults({ year: 2023, eventHashes: ['event1'] })

    // Should still return empty results
    expect(result.athleteIds).toEqual([])

    // Error should be logged in the promise.reason handling
    expect(mockLoggerInstance.error).toHaveBeenCalledWith(
      'Error while cleaning event race results: Error: Database save failed',
      expect.objectContaining({
        year: 2023,
        eventHash: 'event1',
        error: expect.any(Error)
      })
    )
  })
})