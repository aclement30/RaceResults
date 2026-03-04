// Mock the dependencies FIRST before any imports  
jest.mock('../../../shared/data')

// Import and use shared logger mock
import { createLoggerMock, mockLoggerInstance, clearLoggerMocks } from '../__mocks__/logger'

jest.mock('../../../shared/logger', () => createLoggerMock())

import { extractUpgradePoints } from '../../upgrade-points/extract'
import data from '../../../shared/data'
import type { CleanAthleteRaceResult, RawAthleteEventUpgradePoint } from '../../types'

const mockData = data as jest.Mocked<typeof data>

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

const baseMockRaceResultNoPoints: CleanAthleteRaceResult = {
  athleteUciId: '12345678903',
  teamName: 'Team Gamma',
  date: '2023-08-10',
  eventHash: 'event3',
  eventType: 'GRASSROOTS',
  discipline: 'ROAD',
  category: 'Cat3',
  position: 5,
  status: 'FINISHER',
  upgradePoints: 0,
  fieldSize: 25
}

const baseMockRaceResultGrassroots: CleanAthleteRaceResult = {
  athleteUciId: '12345678904',
  teamName: 'Team Delta',
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

const baseMockRaceResultNoEventType: CleanAthleteRaceResult = {
  athleteUciId: '12345678905',
  teamName: 'Team Echo',
  date: '2023-10-01',
  eventHash: 'event5',
  eventType: null,
  discipline: 'ROAD',
  category: 'Cat5',
  position: 4,
  status: 'FINISHER',
  upgradePoints: 4,
  fieldSize: 20
}

const createExpectedUpgradePoint = (
  raceResult: CleanAthleteRaceResult,
  overrides: Partial<RawAthleteEventUpgradePoint> = {}
): RawAthleteEventUpgradePoint => ({
  ...raceResult, // Implementation spreads the entire race result
  points: raceResult.upgradePoints!,
  fieldSize: raceResult.fieldSize || 0,
  type: raceResult.eventType === 'GRASSROOTS' ? 'SUBJECTIVE' : 'UPGRADE',
  ...overrides
})

describe('extractUpgradePoints', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    clearLoggerMocks()
  })

  it('should extract upgrade points from multiple events successfully', async () => {
    const event1RaceResults = [baseMockRaceResult1]
    const event2RaceResults = [baseMockRaceResult2]

    ;(mockData.get.athletesRacesResults as jest.Mock)
    .mockResolvedValueOnce(event1RaceResults)
    .mockResolvedValueOnce(event2RaceResults)
    ;(mockData.update.rawAthletesUpgradePoints as jest.Mock).mockResolvedValue(undefined)

    await extractUpgradePoints({ year: 2023, eventHashes: ['event1', 'event2'] })

    expect(mockData.get.athletesRacesResults).toHaveBeenCalledTimes(2)
    expect(mockData.get.athletesRacesResults).toHaveBeenCalledWith({ eventHash: 'event1', year: 2023 })
    expect(mockData.get.athletesRacesResults).toHaveBeenCalledWith({ eventHash: 'event2', year: 2023 })

    expect(mockData.update.rawAthletesUpgradePoints).toHaveBeenCalledTimes(2)
    expect(mockData.update.rawAthletesUpgradePoints).toHaveBeenCalledWith(
      [createExpectedUpgradePoint(baseMockRaceResult1)],
      { eventHash: 'event1', year: 2023 }
    )
    expect(mockData.update.rawAthletesUpgradePoints).toHaveBeenCalledWith(
      [createExpectedUpgradePoint(baseMockRaceResult2)],
      { eventHash: 'event2', year: 2023 }
    )
  })

  it('should handle different event types and set correct upgrade point types', async () => {
    const upgradeRaceResult = baseMockRaceResult1 // A-race = UPGRADE type
    const subjectiveRaceResult = baseMockRaceResultGrassroots // GRASSROOTS = SUBJECTIVE type

    ;(mockData.get.athletesRacesResults as jest.Mock)
    .mockResolvedValueOnce([upgradeRaceResult])
    .mockResolvedValueOnce([subjectiveRaceResult])
    ;(mockData.update.rawAthletesUpgradePoints as jest.Mock).mockResolvedValue(undefined)

    await extractUpgradePoints({ year: 2023, eventHashes: ['event1', 'event4'] })

    expect(mockData.update.rawAthletesUpgradePoints).toHaveBeenCalledWith(
      [createExpectedUpgradePoint(upgradeRaceResult, { type: 'UPGRADE' })],
      { eventHash: 'event1', year: 2023 }
    )
    expect(mockData.update.rawAthletesUpgradePoints).toHaveBeenCalledWith(
      [createExpectedUpgradePoint(subjectiveRaceResult, { type: 'SUBJECTIVE' })],
      { eventHash: 'event4', year: 2023 }
    )
  })

  it('should filter out race results with no upgrade points', async () => {
    const raceResults = [
        baseMockRaceResult1, // Has upgrade points (10)
        baseMockRaceResultNoPoints, // No upgrade points (0)
        baseMockRaceResult2 // Has upgrade points (8)
      ]

    ;(mockData.get.athletesRacesResults as jest.Mock).mockResolvedValue(raceResults)
    ;(mockData.update.rawAthletesUpgradePoints as jest.Mock).mockResolvedValue(undefined)

    await extractUpgradePoints({ year: 2023, eventHashes: ['event1'] })

    // Should only include results with upgrade points > 0
    expect(mockData.update.rawAthletesUpgradePoints).toHaveBeenCalledWith(
      [
        createExpectedUpgradePoint(baseMockRaceResult1),
        createExpectedUpgradePoint(baseMockRaceResult2)
      ],
      { eventHash: 'event1', year: 2023 }
    )
  })

  it('should handle events with no race results that have upgrade points', async () => {
    const raceResultsWithoutPoints = [baseMockRaceResultNoPoints]

    ;(mockData.get.athletesRacesResults as jest.Mock).mockResolvedValue(raceResultsWithoutPoints)
    ;(mockData.update.rawAthletesUpgradePoints as jest.Mock).mockResolvedValue(undefined)

    await extractUpgradePoints({ year: 2023, eventHashes: ['event3'] })

    // Should save empty array when no upgrade points found
    expect(mockData.update.rawAthletesUpgradePoints).toHaveBeenCalledWith(
      [],
      { eventHash: 'event3', year: 2023 }
    )
  })

  it('should skip events that do not support upgrade points', async () => {
    const massParticipationResult = {
        ...baseMockRaceResult1,
        eventType: 'MASS-PARTICIPATION' as const,
        upgradePoints: 5 // Has points but event type doesn't support them
      }

    ;(mockData.get.athletesRacesResults as jest.Mock).mockResolvedValue([massParticipationResult])
    ;(mockData.update.rawAthletesUpgradePoints as jest.Mock).mockResolvedValue(undefined)

    await extractUpgradePoints({ year: 2023, eventHashes: ['event1'] })

    // Should save empty array since event type doesn't support upgrade points
    expect(mockData.update.rawAthletesUpgradePoints).toHaveBeenCalledWith(
      [],
      { eventHash: 'event1', year: 2023 }
    )

    // Should log warning about event type not having upgrade points
    expect(mockLoggerInstance.warn).toHaveBeenCalledWith(
      'Event event1 (2023) of type MASS-PARTICIPATION does not have upgrade points, skipping extraction'
    )
  })

  it('should handle events with null eventType gracefully', async () => {
    const raceResults = [baseMockRaceResultNoEventType]

    ;(mockData.get.athletesRacesResults as jest.Mock).mockResolvedValue(raceResults)
    ;(mockData.update.rawAthletesUpgradePoints as jest.Mock).mockResolvedValue(undefined)

    await extractUpgradePoints({ year: 2023, eventHashes: ['event5'] })

    // Should save empty array when event type doesn't support upgrade points
    expect(mockData.update.rawAthletesUpgradePoints).toHaveBeenCalledWith(
      [],
      { eventHash: 'event5', year: 2023 }
    )

    // Should log warning about event type not having upgrade points
    expect(mockLoggerInstance.warn).toHaveBeenCalledWith(
      'Event event5 (2023) of type null does not have upgrade points, skipping extraction'
    )
  })

  it('should handle event extraction failures gracefully', async () => {
    const successfulRaceResults = [baseMockRaceResult1]

    ;(mockData.get.athletesRacesResults as jest.Mock)
    .mockResolvedValueOnce(successfulRaceResults)
    .mockRejectedValueOnce(new Error('Failed to get race results'))
    ;(mockData.update.rawAthletesUpgradePoints as jest.Mock).mockResolvedValue(undefined)

    await extractUpgradePoints({ year: 2023, eventHashes: ['event1', 'event2'] })

    // Should only process successful event
    expect(mockData.update.rawAthletesUpgradePoints).toHaveBeenCalledTimes(1)
    expect(mockData.update.rawAthletesUpgradePoints).toHaveBeenCalledWith(
      [createExpectedUpgradePoint(baseMockRaceResult1)],
      { eventHash: 'event1', year: 2023 }
    )

    // Check that logger.error was called for the failed event
    expect(mockLoggerInstance.error).toHaveBeenCalledWith(
      'Error while processing event upgrade points: Error: Failed to get race results',
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

    ;(mockData.get.athletesRacesResults as jest.Mock).mockResolvedValue(raceResults)
    ;(mockData.update.rawAthletesUpgradePoints as jest.Mock).mockRejectedValue(saveError)

    // Should not throw, error should be handled gracefully
    await expect(extractUpgradePoints({ year: 2023, eventHashes: ['event1'] })).resolves.not.toThrow()

    // Check that logger.error was called for the save failure
    expect(mockLoggerInstance.error).toHaveBeenCalledWith(
      'Error while saving raw upgrade points: Error: Database save failed',
      expect.objectContaining({
        hash: 'event1',
        year: 2023,
        error: expect.any(Error)
      })
    )
  })

  it('should process all event types correctly with appropriate upgrade point types', async () => {
    const aRaceResult = { ...baseMockRaceResult1, eventType: 'A' as const }
    const aaRaceResult = { ...baseMockRaceResult1, eventType: 'AA' as const }
    const aaaRaceResult = { ...baseMockRaceResult1, eventType: 'AAA' as const }
    const aaUsaRaceResult = { ...baseMockRaceResult1, eventType: 'AA-USA' as const }
    const grassrootsResult = { ...baseMockRaceResult1, eventType: 'GRASSROOTS' as const }

    ;(mockData.get.athletesRacesResults as jest.Mock)
    .mockResolvedValueOnce([aRaceResult])
    .mockResolvedValueOnce([aaRaceResult])
    .mockResolvedValueOnce([aaaRaceResult])
    .mockResolvedValueOnce([aaUsaRaceResult])
    .mockResolvedValueOnce([grassrootsResult])
    ;(mockData.update.rawAthletesUpgradePoints as jest.Mock).mockResolvedValue(undefined)

    await extractUpgradePoints({
      year: 2023,
      eventHashes: ['event-a', 'event-aa', 'event-aaa', 'event-aa-usa', 'event-grassroots']
    })

    // All A/AA/AAA/AA-USA should be UPGRADE type
    expect(mockData.update.rawAthletesUpgradePoints).toHaveBeenNthCalledWith(1,
      [createExpectedUpgradePoint(aRaceResult, { type: 'UPGRADE' })],
      { eventHash: 'event-a', year: 2023 }
    )
    expect(mockData.update.rawAthletesUpgradePoints).toHaveBeenNthCalledWith(2,
      [createExpectedUpgradePoint(aaRaceResult, { type: 'UPGRADE' })],
      { eventHash: 'event-aa', year: 2023 }
    )
    expect(mockData.update.rawAthletesUpgradePoints).toHaveBeenNthCalledWith(3,
      [createExpectedUpgradePoint(aaaRaceResult, { type: 'UPGRADE' })],
      { eventHash: 'event-aaa', year: 2023 }
    )
    expect(mockData.update.rawAthletesUpgradePoints).toHaveBeenNthCalledWith(4,
      [createExpectedUpgradePoint(aaUsaRaceResult, { type: 'UPGRADE' })],
      { eventHash: 'event-aa-usa', year: 2023 }
    )
    // GRASSROOTS should be SUBJECTIVE type
    expect(mockData.update.rawAthletesUpgradePoints).toHaveBeenNthCalledWith(5,
      [createExpectedUpgradePoint(grassrootsResult, { type: 'SUBJECTIVE' })],
      { eventHash: 'event-grassroots', year: 2023 }
    )
  })
})