// Mock the dependencies FIRST before any imports  
jest.mock('../../../shared/data')

// Import and use shared logger mock
import { createLoggerMock, mockLoggerInstance, clearLoggerMocks } from '../__mocks__/logger'

jest.mock('../../../shared/logger', () => createLoggerMock())

import { cleanUpgradePoints } from '../../upgrade-points/clean'
import data from '../../../shared/data'
import type { BaseAthleteUpgradePoint } from '../../../shared/types.ts'

const mockData = data as jest.Mocked<typeof data>

// Mock current date to ensure consistent filtering
const mockCurrentDate = new Date('2023-12-01T00:00:00.000Z')
jest.useFakeTimers().setSystemTime(mockCurrentDate)

// Base mock data for reuse
const baseMockRawUpgradePoint1: BaseAthleteUpgradePoint = {
  athleteUciId: '12345678901',
  date: '2023-06-15',
  eventHash: 'event1',
  eventType: 'A',
  discipline: 'ROAD',
  position: 1,
  category: 'Cat1',
  points: 10,
  fieldSize: 50,
  type: 'UPGRADE'
}

const baseMockRawUpgradePoint2: BaseAthleteUpgradePoint = {
  athleteUciId: '12345678902',
  date: '2023-07-20',
  eventHash: 'event2',
  eventType: 'AA',
  discipline: 'CX',
  position: 2,
  category: 'Cat2',
  points: 8,
  fieldSize: 30,
  type: 'UPGRADE'
}

const baseMockOldUpgradePoint: BaseAthleteUpgradePoint = {
  athleteUciId: '12345678903',
  date: '2022-10-01', // Older than 12 months
  eventHash: 'event3',
  eventType: 'GRASSROOTS',
  discipline: 'ROAD',
  position: 5,
  category: 'Cat3',
  points: 4,
  fieldSize: 25,
  type: 'SUBJECTIVE'
}

const baseMockRecentUpgradePoint: BaseAthleteUpgradePoint = {
  athleteUciId: '12345678904',
  date: '2023-01-15', // Within 12 months
  eventHash: 'event4',
  eventType: 'GRASSROOTS',
  discipline: 'CX',
  position: 3,
  category: 'Cat4',
  points: 6,
  fieldSize: 40,
  type: 'SUBJECTIVE'
}

const baseMockExistingUpgradePoint: BaseAthleteUpgradePoint = {
  athleteUciId: '12345678901',
  date: '2023-06-15',
  eventHash: 'event1',
  eventType: 'A',
  discipline: 'ROAD',
  position: 2, // Different position from raw data
  category: 'Cat1',
  points: 8, // Different points from raw data
  fieldSize: 50,
  type: 'UPGRADE'
}

describe('cleanUpgradePoints', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    clearLoggerMocks()
  })

  afterAll(() => {
    jest.useRealTimers()
  })

  it('should process new upgrade points successfully', async () => {
    const rawUpgradePoints = [baseMockRawUpgradePoint1, baseMockRawUpgradePoint2]
    const existingUpgradePoints: BaseAthleteUpgradePoint[] = []

    ;(mockData.get.rawAthletesUpgradePoints as jest.Mock).mockResolvedValue(rawUpgradePoints)
    ;(mockData.get.athletesUpgradePoints as jest.Mock).mockResolvedValue(existingUpgradePoints)
    ;(mockData.update.athletesUpgradePoints as jest.Mock).mockResolvedValue(undefined)

    await cleanUpgradePoints({ year: 2023, eventHashes: ['event1'] })

    expect(mockData.update.athletesUpgradePoints).toHaveBeenCalledWith(
      [baseMockRawUpgradePoint1, baseMockRawUpgradePoint2],
      { eventHash: 'event1', year: 2023 }
    )
  })

  it('should update existing upgrade points when new data is provided', async () => {
    const rawUpgradePoints = [baseMockRawUpgradePoint1] // Updated data
    const existingUpgradePoints = [baseMockExistingUpgradePoint] // Existing old data

    ;(mockData.get.rawAthletesUpgradePoints as jest.Mock).mockResolvedValue(rawUpgradePoints)
    ;(mockData.get.athletesUpgradePoints as jest.Mock).mockResolvedValue(existingUpgradePoints)
    ;(mockData.update.athletesUpgradePoints as jest.Mock).mockResolvedValue(undefined)

    await cleanUpgradePoints({ year: 2023, eventHashes: ['event1'] })

    // Should replace existing upgrade point with new data
    expect(mockData.update.athletesUpgradePoints).toHaveBeenCalledWith(
      [baseMockRawUpgradePoint1], // New data should replace old
      { eventHash: 'event1', year: 2023 }
    )
  })

  it('should add new upgrade points alongside existing ones for different athletes/events/categories', async () => {
    const newUpgradePoint = baseMockRawUpgradePoint2 // Different athlete
    const rawUpgradePoints = [newUpgradePoint]
    const existingUpgradePoints = [baseMockExistingUpgradePoint]

    ;(mockData.get.rawAthletesUpgradePoints as jest.Mock).mockResolvedValue(rawUpgradePoints)
    ;(mockData.get.athletesUpgradePoints as jest.Mock).mockResolvedValue(existingUpgradePoints)
    ;(mockData.update.athletesUpgradePoints as jest.Mock).mockResolvedValue(undefined)

    await cleanUpgradePoints({ year: 2023, eventHashes: ['event1'] })

    // Should include both existing and new upgrade points
    expect(mockData.update.athletesUpgradePoints).toHaveBeenCalledWith(
      expect.arrayContaining([
        baseMockExistingUpgradePoint, // Existing point should remain
        newUpgradePoint // New point should be added
      ]),
      { eventHash: 'event1', year: 2023 }
    )
  })

  it('should filter out upgrade points older than 12 months', async () => {
    const rawUpgradePoints = [baseMockRawUpgradePoint1] // Recent
    const existingUpgradePoints = [
        baseMockOldUpgradePoint, // Old - should be filtered out
        baseMockRecentUpgradePoint // Recent - should be kept
      ]

    ;(mockData.get.rawAthletesUpgradePoints as jest.Mock).mockResolvedValue(rawUpgradePoints)
    ;(mockData.get.athletesUpgradePoints as jest.Mock).mockResolvedValue(existingUpgradePoints)
    ;(mockData.update.athletesUpgradePoints as jest.Mock).mockResolvedValue(undefined)

    await cleanUpgradePoints({ year: 2023, eventHashes: ['event1'] })

    // Should only include recent upgrade points (not old ones)
    expect(mockData.update.athletesUpgradePoints).toHaveBeenCalledWith(
      expect.arrayContaining([
        baseMockRecentUpgradePoint, // Recent existing point kept
        baseMockRawUpgradePoint1 // New point added
      ]),
      { eventHash: 'event1', year: 2023 }
    )

    // Should not include the old upgrade point
    const savedPoints = (mockData.update.athletesUpgradePoints as jest.Mock).mock.calls[0][0]
    expect(savedPoints).not.toContainEqual(baseMockOldUpgradePoint)
  })

  it('should handle multiple event hashes sequentially', async () => {
    const event1RawPoints = [baseMockRawUpgradePoint1]
    const event2RawPoints = [baseMockRawUpgradePoint2]
    const existingPoints: BaseAthleteUpgradePoint[] = []

    ;(mockData.get.rawAthletesUpgradePoints as jest.Mock)
    .mockResolvedValueOnce(event1RawPoints)
    .mockResolvedValueOnce(event2RawPoints)
    ;(mockData.get.athletesUpgradePoints as jest.Mock).mockResolvedValue(existingPoints)
    ;(mockData.update.athletesUpgradePoints as jest.Mock).mockResolvedValue(undefined)

    await cleanUpgradePoints({ year: 2023, eventHashes: ['event1', 'event2'] })

    expect(mockData.get.rawAthletesUpgradePoints).toHaveBeenCalledTimes(2)
    expect(mockData.get.rawAthletesUpgradePoints).toHaveBeenCalledWith('event1', 2023)
    expect(mockData.get.rawAthletesUpgradePoints).toHaveBeenCalledWith('event2', 2023)

    expect(mockData.update.athletesUpgradePoints).toHaveBeenCalledTimes(2)
    expect(mockData.update.athletesUpgradePoints).toHaveBeenNthCalledWith(1,
      [baseMockRawUpgradePoint1],
      { eventHash: 'event1', year: 2023 }
    )
    expect(mockData.update.athletesUpgradePoints).toHaveBeenNthCalledWith(2,
      [baseMockRawUpgradePoint2],
      { eventHash: 'event2', year: 2023 }
    )
  })

  it('should handle save errors gracefully', async () => {
    const rawUpgradePoints = [baseMockRawUpgradePoint1]
    const saveError = new Error('Database save failed')

    ;(mockData.get.rawAthletesUpgradePoints as jest.Mock).mockResolvedValue(rawUpgradePoints)
    ;(mockData.get.athletesUpgradePoints as jest.Mock).mockResolvedValue([])
    ;(mockData.update.athletesUpgradePoints as jest.Mock).mockRejectedValue(saveError)

    // Should not throw, error should be handled gracefully
    await expect(cleanUpgradePoints({ year: 2023, eventHashes: ['event1'] })).resolves.not.toThrow()

    // Check that logger.error was called for the save failure
    expect(mockLoggerInstance.error).toHaveBeenCalledWith(
      'Error while cleaning event upgrade points: Error: Database save failed',
      expect.objectContaining({
        year: 2023,
        eventHash: 'event1',
        error: expect.any(Error)
      })
    )
  })

  it('should handle matching upgrade points with different event/category combinations', async () => {
    const sameAthleteUpgradePoint = {
      ...baseMockRawUpgradePoint1,
      eventHash: 'event2', // Different event
      category: 'Cat2' // Different category
    }
    const rawUpgradePoints = [baseMockRawUpgradePoint1, sameAthleteUpgradePoint]
    const existingUpgradePoints = [baseMockExistingUpgradePoint] // Same athlete/event/category as first raw point

    ;(mockData.get.rawAthletesUpgradePoints as jest.Mock).mockResolvedValue(rawUpgradePoints)
    ;(mockData.get.athletesUpgradePoints as jest.Mock).mockResolvedValue(existingUpgradePoints)
    ;(mockData.update.athletesUpgradePoints as jest.Mock).mockResolvedValue(undefined)

    await cleanUpgradePoints({ year: 2023, eventHashes: ['event1'] })

    // Should replace matching point and add new point for different event/category
    expect(mockData.update.athletesUpgradePoints).toHaveBeenCalledWith(
      [
        baseMockRawUpgradePoint1, // Should replace existing point with same athleteUciId/eventHash/category
        sameAthleteUpgradePoint // Should add as new point (different event/category)
      ],
      { eventHash: 'event1', year: 2023 }
    )
  })

  it('should handle data fetch errors gracefully', async () => {
    const fetchError = new Error('Failed to fetch data')

    ;(mockData.get.rawAthletesUpgradePoints as jest.Mock).mockRejectedValue(fetchError)
    ;(mockData.get.athletesUpgradePoints as jest.Mock).mockResolvedValue([])

    // Should not throw, error should be handled gracefully
    await expect(cleanUpgradePoints({ year: 2023, eventHashes: ['event1'] })).resolves.not.toThrow()

    // Check that logger.error was called for the fetch failure
    expect(mockLoggerInstance.error).toHaveBeenCalledWith(
      'Error while cleaning event upgrade points: Error: Failed to fetch data',
      expect.objectContaining({
        year: 2023,
        eventHash: 'event1',
        error: expect.any(Error)
      })
    )
  })
})