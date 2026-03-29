// Mock the dependencies FIRST before any imports
import { CleanAthleteRaceResult } from '../../types'

jest.mock('../../../shared/data')

// Import and use shared logger mock
import { createLoggerMock, clearLoggerMocks, mockLoggerInstance } from '../__mocks__/logger'

jest.mock('../../../shared/logger', () => createLoggerMock())

import { createViewAthleteProfiles } from '../../views/athlete-profiles'
import data from '../../../shared/data'
import type { RaceEvent, AthleteProfile, BaseAthleteUpgradePoint } from '../../../shared/types'

const mockData = data as jest.Mocked<typeof data>

// Base mock data for reuse
const baseMockEvent1: Partial<RaceEvent> = {
  hash: 'event-hash-1',
  name: 'Test Race 1',
  categories: [
    { alias: 'cat1', label: 'Category 1' },
    { alias: 'cat2', label: 'Category 2' }
  ] as RaceEvent['categories'],
  date: '2023-06-15',
  discipline: 'ROAD',
}

const baseMockEvent2: Partial<RaceEvent> = {
  hash: 'event-hash-2',
  name: 'Test Race 2',
  categories: [
    { alias: 'cat1', label: 'Category 1' }
  ] as RaceEvent['categories'],
  date: '2023-07-01',
  discipline: 'CX',
}

const baseMockRaceResult1: CleanAthleteRaceResult = {
  athleteUciId: '12345678901',
  eventHash: 'event-hash-1',
  category: 'cat1',
  position: 5,
  fieldSize: 50,
  upgradePoints: 10,
  status: 'FINISHER',
  date: '2023-06-15',
  eventType: 'A',
  discipline: 'ROAD'
}

const baseMockRaceResult2: CleanAthleteRaceResult = {
  athleteUciId: '12345678901',
  eventHash: 'event-hash-2',
  category: 'cat1',
  position: 3,
  fieldSize: 30,
  upgradePoints: 15,
  status: 'FINISHER',
  date: '2023-07-01',
  eventType: 'AA',
  discipline: 'CX'
}

const baseMockUpgradePoint1: BaseAthleteUpgradePoint = {
  athleteUciId: '12345678901',
  eventHash: 'event-hash-1',
  category: 'cat1',
  points: 10,
  position: 5,
  fieldSize: 50,
  date: '2023-06-15',
  eventType: 'A',
  discipline: 'ROAD',
  type: 'UPGRADE'
}

const baseMockUpgradePoint2: BaseAthleteUpgradePoint = {
  athleteUciId: '12345678901',
  eventHash: 'event-hash-2',
  category: 'cat1',
  points: 15,
  position: 3,
  fieldSize: 30,
  date: '2023-06-15',
  eventType: 'A',
  discipline: 'ROAD',
  type: 'SUBJECTIVE'
}

const baseMockProfile: AthleteProfile = {
  uciId: '12345678901',
  races: [
    {
      eventHash: 'existing-event',
      eventName: 'Existing Race',
      category: 'cat1',
      categoryLabel: 'Category 1',
      position: 1,
      status: 'FINISHER',
      date: '2024-05-01',
      eventType: 'A',
      discipline: 'ROAD'
    }
  ],
  upgradePoints: [
    {
      eventHash: 'existing-event',
      eventName: 'Existing Race',
      category: 'cat1',
      categoryLabel: 'Category 1',
      points: 20,
      position: 1,
      fieldSize: 25,
      date: '2024-06-15',
      eventType: 'A',
      discipline: 'ROAD',
      type: 'SUBJECTIVE'
    }
  ]
}

describe('createViewAthleteProfiles', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    clearLoggerMocks()

    // Reset DEBUG to false for each test
    jest.doMock('../../../shared/config', () => ({
      DEBUG: false
    }))
  })

  it('should process athlete profiles with races and upgrade points successfully', async () => {
    const athleteIds = ['12345678901']
    const year = 2023
    const eventHashes = ['event-hash-1', 'event-hash-2']

    ;(mockData.get.events as jest.Mock).mockResolvedValue([baseMockEvent1, baseMockEvent2])
    ;(mockData.get.athletesRacesResults as jest.Mock).mockResolvedValue([baseMockRaceResult1, baseMockRaceResult2])
    ;(mockData.get.athletesUpgradePoints as jest.Mock).mockResolvedValue([baseMockUpgradePoint1, baseMockUpgradePoint2])
    ;(mockData.get.athleteProfile as jest.Mock).mockResolvedValue(baseMockProfile)
    ;(mockData.update.athleteProfile as jest.Mock).mockResolvedValue(undefined)

    await createViewAthleteProfiles({ athleteIds, year, eventHashes })

    // Should fetch events with correct parameters
    expect(mockData.get.events).toHaveBeenCalledWith({ year, eventHashes }, { summary: false })

    // Should fetch race results and upgrade points
    expect(mockData.get.athletesRacesResults).toHaveBeenCalledWith({ eventHashes, year })
    expect(mockData.get.athletesUpgradePoints).toHaveBeenCalledWith({ eventHashes, year })

    // Should fetch athlete profile twice (once for races, once for upgrade points)
    expect(mockData.get.athleteProfile).toHaveBeenCalledTimes(2)
    expect(mockData.get.athleteProfile).toHaveBeenCalledWith('12345678901')

    // Should update athlete profile twice (races then upgrade points)
    expect(mockData.update.athleteProfile).toHaveBeenCalledTimes(2)

    // First call should be for races
    const firstProfileUpdate = (mockData.update.athleteProfile as jest.Mock).mock.calls[0][0]
    expect(firstProfileUpdate.races).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          eventHash: 'existing-event' // Existing race preserved
        }),
        expect.objectContaining({
          eventHash: 'event-hash-1',
          eventName: 'Test Race 1',
          categoryLabel: 'Category 1',
          position: 5,
          status: 'FINISHER',
          date: '2023-06-15',
          eventType: 'A',
          discipline: 'ROAD'
          // firstName, lastName, fieldSize, upgradePoints should be omitted
        }),
        expect.objectContaining({
          eventHash: 'event-hash-2',
          eventName: 'Test Race 2',
          categoryLabel: 'Category 1',
          position: 3,
          status: 'FINISHER',
          date: '2023-07-01',
          eventType: 'AA',
          discipline: 'CX'
        })
      ])
    )

    // Second call should be for upgrade points
    const secondProfileUpdate = (mockData.update.athleteProfile as jest.Mock).mock.calls[1][0]
    expect(secondProfileUpdate.upgradePoints).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          eventHash: 'existing-event' // Existing upgrade point preserved
        }),
        expect.objectContaining({
          eventHash: 'event-hash-1',
          eventName: 'Test Race 1',
          categoryLabel: 'Category 1',
          points: 10,
          position: 5,
          fieldSize: 50,
          date: '2023-06-15',
          eventType: 'A',
          discipline: 'ROAD',
          type: 'UPGRADE'
          // athleteUciId should be omitted
        }),
        expect.objectContaining({
          eventHash: 'event-hash-2',
          eventName: 'Test Race 2',
          categoryLabel: 'Category 1',
          points: 15,
          position: 3,
          fieldSize: 30,
          date: '2023-06-15',
          eventType: 'A',
          discipline: 'ROAD',
          type: 'SUBJECTIVE'
        })
      ])
    )
  })

  it('should create new profiles when athlete profiles do not exist', async () => {
    const athleteIds = ['12345678901']
    const year = 2023
    const eventHashes = ['event-hash-1']

    ;(mockData.get.events as jest.Mock).mockResolvedValue([baseMockEvent1])
    ;(mockData.get.athletesRacesResults as jest.Mock).mockResolvedValue([baseMockRaceResult1])
    ;(mockData.get.athletesUpgradePoints as jest.Mock).mockResolvedValue([baseMockUpgradePoint1])
    ;(mockData.get.athleteProfile as jest.Mock).mockResolvedValue(null) // No existing profile
    ;(mockData.update.athleteProfile as jest.Mock).mockResolvedValue(undefined)

    await createViewAthleteProfiles({ athleteIds, year, eventHashes })

    // Should create new profile structure for both calls
    const profileUpdates = (mockData.update.athleteProfile as jest.Mock).mock.calls

    // First update (races) should have new profile with uciId
    expect(profileUpdates[0][0]).toEqual(expect.objectContaining({
      uciId: '12345678901',
      races: expect.any(Array)
    }))

    // Second update (upgrade points) should have new profile with uciId  
    expect(profileUpdates[1][0]).toEqual(expect.objectContaining({
      uciId: '12345678901',
      upgradePoints: expect.any(Array)
    }))
  })

  it('should handle missing events gracefully', async () => {
    const athleteIds = ['12345678901']
    const year = 2023
    const eventHashes = ['event-hash-1', 'missing-event']

    const raceWithMissingEvent: CleanAthleteRaceResult = {
      ...baseMockRaceResult1,
      eventHash: 'missing-event'
    }

    const upgradePointWithMissingEvent: BaseAthleteUpgradePoint = {
        ...baseMockUpgradePoint1,
        eventHash: 'missing-event'
      }

    ;(mockData.get.events as jest.Mock).mockResolvedValue([baseMockEvent1]) // Only one event
    ;(mockData.get.athletesRacesResults as jest.Mock).mockResolvedValue([baseMockRaceResult1, raceWithMissingEvent])
    ;(mockData.get.athletesUpgradePoints as jest.Mock).mockResolvedValue([
      baseMockUpgradePoint1,
      upgradePointWithMissingEvent
    ])
    ;(mockData.get.athleteProfile as jest.Mock).mockResolvedValue({ uciId: '12345678901' })
    ;(mockData.update.athleteProfile as jest.Mock).mockResolvedValue(undefined)

    await createViewAthleteProfiles({ athleteIds, year, eventHashes })

    // Should log errors for missing events
    expect(mockLoggerInstance.error).toHaveBeenCalledWith('Event not found for event: missing-event')

    // Should only process valid events
    const profileUpdates = (mockData.update.athleteProfile as jest.Mock).mock.calls
    expect(profileUpdates[0][0].races).toHaveLength(1) // Only valid race
    expect(profileUpdates[1][0].upgradePoints).toHaveLength(1) // Only valid upgrade point
  })

  it('should handle missing categories gracefully', async () => {
    const athleteIds = ['12345678901']
    const year = 2023
    const eventHashes = ['event-hash-1']

    const raceWithMissingCategory: CleanAthleteRaceResult = {
      ...baseMockRaceResult1,
      category: 'missing-category'
    }

    const upgradePointWithMissingCategory: BaseAthleteUpgradePoint = {
        ...baseMockUpgradePoint1,
        category: 'missing-category'
      }

    ;(mockData.get.events as jest.Mock).mockResolvedValue([baseMockEvent1])
    ;(mockData.get.athletesRacesResults as jest.Mock).mockResolvedValue([raceWithMissingCategory])
    ;(mockData.get.athletesUpgradePoints as jest.Mock).mockResolvedValue([upgradePointWithMissingCategory])
    ;(mockData.get.athleteProfile as jest.Mock).mockResolvedValue({ uciId: '12345678901' })
    ;(mockData.update.athleteProfile as jest.Mock).mockResolvedValue(undefined)

    await createViewAthleteProfiles({ athleteIds, year, eventHashes })

    // Should log errors for missing categories
    expect(mockLoggerInstance.error).toHaveBeenCalledWith('Category not found for event: event-hash-1')

    // Should filter out invalid races/points
    const profileUpdates = (mockData.update.athleteProfile as jest.Mock).mock.calls
    expect(profileUpdates[0][0].races).toHaveLength(0) // No valid races
    expect(profileUpdates[1][0].upgradePoints).toHaveLength(0) // No valid upgrade points
  })

  it('should preserve existing races and upgrade points from other events', async () => {
    const athleteIds = ['12345678901']
    const year = 2023
    const eventHashes = ['event-hash-1'] // Processing only one event

    const existingProfile = {
        uciId: '12345678901',
        races: [
          {
            eventHash: 'other-event',
            eventName: 'Other Race',
            category: 'cat1',
            categoryLabel: 'Category 1',
            position: 2
          },
          {
            eventHash: 'event-hash-1', // This should be replaced
            eventName: 'Old Event Name',
            category: 'cat1',
            categoryLabel: 'Category 1',
            position: 10
          }
        ],
        upgradePoints: [
          {
            eventHash: 'other-event',
            eventName: 'Other Race',
            category: 'cat1',
            categoryLabel: 'Category 1',
            points: 25
          },
          {
            eventHash: 'event-hash-1', // This should be replaced
            eventName: 'Old Event Name',
            category: 'cat1',
            categoryLabel: 'Category 1',
            points: 5
          }
        ]
      }

    ;(mockData.get.events as jest.Mock).mockResolvedValue([baseMockEvent1])
    ;(mockData.get.athletesRacesResults as jest.Mock).mockResolvedValue([baseMockRaceResult1])
    ;(mockData.get.athletesUpgradePoints as jest.Mock).mockResolvedValue([baseMockUpgradePoint1])
    ;(mockData.get.athleteProfile as jest.Mock).mockResolvedValue(existingProfile)
    ;(mockData.update.athleteProfile as jest.Mock).mockResolvedValue(undefined)

    await createViewAthleteProfiles({ athleteIds, year, eventHashes })

    const profileUpdates = (mockData.update.athleteProfile as jest.Mock).mock.calls

    // Should preserve races from other events and update current event
    expect(profileUpdates[0][0].races).toEqual([
      expect.objectContaining({
        eventHash: 'other-event' // Preserved
      }),
      expect.objectContaining({
        eventHash: 'event-hash-1',
        eventName: 'Test Race 1', // Updated
        position: 5 // Updated
      })
    ])

    // Should preserve upgrade points from other events and update current event
    expect(profileUpdates[1][0].upgradePoints).toEqual([
      expect.objectContaining({
        eventHash: 'other-event' // Preserved
      }),
      expect.objectContaining({
        eventHash: 'event-hash-1',
        eventName: 'Test Race 1', // Updated
        points: 10 // Updated
      })
    ])
  })

  it('should handle profile update errors gracefully', async () => {
    const athleteIds = ['12345678901', '12345678902']
    const year = 2023
    const eventHashes = ['event-hash-1']

    ;(mockData.get.events as jest.Mock).mockResolvedValue([baseMockEvent1])
    ;(mockData.get.athletesRacesResults as jest.Mock).mockResolvedValue([baseMockRaceResult1])
    ;(mockData.get.athletesUpgradePoints as jest.Mock).mockResolvedValue([baseMockUpgradePoint1])
    ;(mockData.get.athleteProfile as jest.Mock).mockResolvedValue({ uciId: '12345678901' })

    // Mock first athlete success, second athlete failure
    ;(mockData.update.athleteProfile as jest.Mock)
    .mockResolvedValueOnce(undefined)
    .mockRejectedValueOnce(new Error('Database error'))
    .mockResolvedValueOnce(undefined)
    .mockRejectedValueOnce(new Error('Database error'))

    await createViewAthleteProfiles({ athleteIds, year, eventHashes })

    // Should log errors for failed updates
    expect(mockLoggerInstance.error).toHaveBeenCalledWith(
      expect.stringContaining('Error while compiling races for athlete profile for 12345678902:'),
      expect.objectContaining({
        error: expect.any(Error),
        athleteUciId: '12345678902'
      })
    )

    expect(mockLoggerInstance.error).toHaveBeenCalledWith(
      expect.stringContaining('Error while compiling upgrade points for athlete profile for 12345678902:'),
      expect.objectContaining({
        error: expect.any(Error),
        athleteUciId: '12345678902'
      })
    )
  })
})