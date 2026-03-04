// Mock the dependencies FIRST before any imports
import { EventSummary } from '../../../shared/types'

jest.mock('../../../shared/data')

// Import and use shared logger mock
import { createLoggerMock, mockLoggerInstance, clearLoggerMocks } from '../__mocks__/logger'

jest.mock('../../../shared/logger', () => createLoggerMock())

jest.mock('../../config', () => ({
  DEFAULT_EVENT_FILTERS: {},
}))

import { extractRaceResults } from '../../race-results/extract'
import data from '../../../shared/data'
import type { RawAthleteRaceResult } from '../../types'
import { EventAthlete, EventResults } from '../../../../src/types/results'

const mockData = data as jest.Mocked<typeof data>

// Base mock data for reuse
const baseMockEvent1: EventSummary = {
  hash: 'event1',
  year: 2023,
  date: '2023-06-15',
  name: 'Test Race 1',
  location: { country: 'CA', province: 'ON', city: 'Toronto' },
  sanctionedEventType: 'A',
  discipline: 'ROAD',
  organizerAlias: 'test-organizer'
}

const baseMockEvent2: EventSummary = {
  hash: 'event2',
  year: 2023,
  date: '2023-07-20',
  name: 'Test Race 2',
  location: { country: 'CA', province: 'BC', city: 'Vancouver' },
  sanctionedEventType: 'AA',
  discipline: 'CX',
  organizerAlias: 'test-organizer'
}

const baseMockEvents = [baseMockEvent1, baseMockEvent2]

const baseMockAthlete1: EventAthlete = {
  uciId: '12345678901',
  firstName: 'John',
  lastName: 'Doe',
  gender: 'M',
  city: 'Toronto',
  province: 'ON',
  license: 'ABC123',
  age: 33,
  nationality: 'CAN',
  team: 'Team Alpha',
}

const baseMockAthlete2: EventAthlete = {
  uciId: '12345678902',
  firstName: 'Jane',
  lastName: 'Smith',
  gender: 'F',
  city: 'Vancouver',
  province: 'BC',
  license: 'DEF456',
  age: 28,
  nationality: 'CAN',
  team: 'Team Beta',
}

const createMockEventResults = (
  event: EventSummary,
  athletes: Record<string, EventAthlete> = { '1': baseMockAthlete1 },
  customResults?: any
): EventResults => ({
  hash: event.hash,
  athletes,
  results: customResults || {
    'Cat1': {
      fieldSize: 50,
      results: [
        {
          athleteId: 1,
          position: 1,
          status: 'FINISHER',
          upgradePoints: 10
        }
      ]
    }
  },
  sourceUrls: [],
  lastUpdated: event.date
})

const createExpectedRaceResult = (
  athlete: EventAthlete,
  event: EventSummary,
  overrides: Partial<RawAthleteRaceResult> = {}
): RawAthleteRaceResult => ({
  athleteUciId: athlete.uciId!,
  firstName: athlete.firstName!,
  lastName: athlete.lastName!,
  teamName: athlete.team,
  date: event.date,
  eventHash: event.hash,
  eventType: event.sanctionedEventType,
  discipline: event.discipline,
  category: 'Cat1',
  position: 1,
  status: 'FINISHER',
  upgradePoints: 10,
  fieldSize: 50,
  ...overrides
})

describe('extractRaceResults', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    clearLoggerMocks()
  })

  it('should extract race results from multiple events successfully', async () => {
    const mockEventResults1 = createMockEventResults(baseMockEvent1)
    const mockEventResults2 = createMockEventResults(baseMockEvent2,
        { '1': baseMockAthlete2 },
        {
          'Cat2': {
            fieldSize: 30,
            results: [
              {
                athleteId: 1,
                position: 2,
                status: 'FINISHER',
                upgradePoints: 8
              }
            ]
          }
        }
      )

    ;(mockData.get.events as jest.Mock).mockResolvedValue(baseMockEvents)
    ;(mockData.get.eventResults as jest.Mock)
    .mockResolvedValueOnce(mockEventResults1)
    .mockResolvedValueOnce(mockEventResults2)
    ;(mockData.update.rawAthletesRaceResults as jest.Mock).mockResolvedValue(undefined)

    const result = await extractRaceResults({ year: 2023 })

    expect(result).toEqual({
      year: 2023,
      eventHashes: ['event1', 'event2']
    })

    expect(mockData.get.events).toHaveBeenCalledWith({ year: 2023 }, { summary: true })
    expect(mockData.get.eventResults).toHaveBeenCalledTimes(2)
    expect(mockData.update.rawAthletesRaceResults).toHaveBeenCalledTimes(2)

    // Verify first event race results
    expect(mockData.update.rawAthletesRaceResults).toHaveBeenCalledWith(
      [createExpectedRaceResult(baseMockAthlete1, baseMockEvent1)],
      { eventHash: 'event1', year: 2023 }
    )

    // Verify second event race results  
    expect(mockData.update.rawAthletesRaceResults).toHaveBeenCalledWith(
      [
        createExpectedRaceResult(baseMockAthlete2, baseMockEvent2, {
          category: 'Cat2',
          position: 2,
          upgradePoints: 8,
          fieldSize: 30
        })
      ],
      { eventHash: 'event2', year: 2023 }
    )
  })

  it('should filter by specific event hash when provided', async () => {
    const mockEventResults = createMockEventResults(baseMockEvent1)

    ;(mockData.get.events as jest.Mock).mockResolvedValue([baseMockEvent1])
    ;(mockData.get.eventResults as jest.Mock).mockResolvedValue(mockEventResults)
    ;(mockData.update.rawAthletesRaceResults as jest.Mock).mockResolvedValue(undefined)

    const result = await extractRaceResults({ year: 2023, eventHash: 'event1' })

    expect(result).toEqual({
      year: 2023,
      eventHashes: ['event1']
    })

    expect(mockData.get.events).toHaveBeenCalledWith({
      year: 2023,
      eventHash: 'event1'
    }, { summary: true })
  })

  it('should skip athletes without UCI ID and incomplete names', async () => {
    const athleteNoUciId = {
      ...baseMockAthlete1,
      uciId: '',
      firstName: '',
      lastName: 'Partial'
    }

    const mockEventResults = createMockEventResults(baseMockEvent1, { '1': athleteNoUciId })

    ;(mockData.get.events as jest.Mock).mockResolvedValue([baseMockEvent1])
    ;(mockData.get.eventResults as jest.Mock).mockResolvedValue(mockEventResults)
    ;(mockData.update.rawAthletesRaceResults as jest.Mock).mockResolvedValue(undefined)

    await extractRaceResults({ year: 2023 })

    // Should save empty array since athlete is skipped
    expect(mockData.update.rawAthletesRaceResults).toHaveBeenCalledWith(
      [],
      { eventHash: 'event1', year: 2023 }
    )
  })

  it('should skip athletes not found in results', async () => {
    const mockEventResults = createMockEventResults(baseMockEvent1,
        { '1': baseMockAthlete1 }, // Athlete with ID 1
        {
          'Cat1': {
            fieldSize: 50,
            results: [
              {
                athleteId: 999, // Non-existent athlete ID
                position: 1,
                status: 'FINISHER',
                upgradePoints: 10
              }
            ]
          }
        }
      )

    ;(mockData.get.events as jest.Mock).mockResolvedValue([baseMockEvent1])
    ;(mockData.get.eventResults as jest.Mock).mockResolvedValue(mockEventResults)
    ;(mockData.update.rawAthletesRaceResults as jest.Mock).mockResolvedValue(undefined)

    await extractRaceResults({ year: 2023 })

    // Should save an empty array since athlete 999 doesn't exist
    expect(mockData.update.rawAthletesRaceResults).toHaveBeenCalledWith(
      [],
      { eventHash: 'event1', year: 2023 }
    )
  })

  it('should skip combined/umbrella categories', async () => {
    const mockEventResults = createMockEventResults(baseMockEvent1,
        { '1': baseMockAthlete1 },
        {
          'Combined Cat': {
            combinedCategories: ['Cat1', 'Cat2'], // This marks it as umbrella category
            fieldSize: 100,
            results: [
              {
                athleteId: 1,
                position: 1,
                status: 'FINISHER',
                upgradePoints: 15
              }
            ]
          },
          'Regular Cat': {
            fieldSize: 50,
            results: [
              {
                athleteId: 1,
                position: 2,
                status: 'FINISHER',
                upgradePoints: 8
              }
            ]
          }
        }
      )

    ;(mockData.get.events as jest.Mock).mockResolvedValue([baseMockEvent1])
    ;(mockData.get.eventResults as jest.Mock).mockResolvedValue(mockEventResults)
    ;(mockData.update.rawAthletesRaceResults as jest.Mock).mockResolvedValue(undefined)

    await extractRaceResults({ year: 2023 })

    // Should only include results from 'Regular Cat', not 'Combined Cat'
    expect(mockData.update.rawAthletesRaceResults).toHaveBeenCalledWith(
      [
        createExpectedRaceResult(baseMockAthlete1, baseMockEvent1, {
          category: 'Regular Cat',
          position: 2,
          upgradePoints: 8,
          fieldSize: 50
        })
      ],
      { eventHash: 'event1', year: 2023 }
    )
  })

  it('should handle multiple athletes in same category', async () => {
    const mockEventResults = createMockEventResults(baseMockEvent1,
        {
          '1': baseMockAthlete1,
          '2': baseMockAthlete2
        },
        {
          'Cat1': {
            fieldSize: 50,
            results: [
              {
                athleteId: 1,
                position: 1,
                status: 'FINISHER',
                upgradePoints: 10
              },
              {
                athleteId: 2,
                position: 3,
                status: 'FINISHER',
                upgradePoints: 6
              }
            ]
          }
        }
      )

    ;(mockData.get.events as jest.Mock).mockResolvedValue([baseMockEvent1])
    ;(mockData.get.eventResults as jest.Mock).mockResolvedValue(mockEventResults)
    ;(mockData.update.rawAthletesRaceResults as jest.Mock).mockResolvedValue(undefined)

    await extractRaceResults({ year: 2023 })

    expect(mockData.update.rawAthletesRaceResults).toHaveBeenCalledWith(
      expect.arrayContaining([
        createExpectedRaceResult(baseMockAthlete1, baseMockEvent1, {
          position: 1,
          upgradePoints: 10
        }),
        createExpectedRaceResult(baseMockAthlete2, baseMockEvent1, {
          position: 3,
          upgradePoints: 6
        })
      ]),
      { eventHash: 'event1', year: 2023 }
    )
  })

  it('should handle default values for missing fields', async () => {
    const athleteWithoutTeam = { ...baseMockAthlete1, team: undefined }
    const mockEventResults = createMockEventResults(baseMockEvent1,
        { '1': athleteWithoutTeam },
        {
          'Cat1': {
            // No fieldSize provided
            results: [
              {
                athleteId: 1,
                position: 1,
                status: 'FINISHER'
                // No upgradePoints provided
              }
            ]
          }
        }
      )

    ;(mockData.get.events as jest.Mock).mockResolvedValue([baseMockEvent1])
    ;(mockData.get.eventResults as jest.Mock).mockResolvedValue(mockEventResults)
    ;(mockData.update.rawAthletesRaceResults as jest.Mock).mockResolvedValue(undefined)

    await extractRaceResults({ year: 2023 })

    expect(mockData.update.rawAthletesRaceResults).toHaveBeenCalledWith(
      [
        createExpectedRaceResult(baseMockAthlete1, baseMockEvent1, {
          teamName: undefined,
          upgradePoints: 0,
          fieldSize: 0
        })
      ],
      { eventHash: 'event1', year: 2023 }
    )
  })

  it('should handle event extraction failures gracefully', async () => {
    const workingEvent = baseMockEvent1
    const failingEvent = baseMockEvent2

    ;(mockData.get.events as jest.Mock).mockResolvedValue([workingEvent, failingEvent])
    ;(mockData.get.eventResults as jest.Mock)
    .mockResolvedValueOnce(createMockEventResults(workingEvent))
    .mockRejectedValueOnce(new Error('Failed to get event results'))
    ;(mockData.update.rawAthletesRaceResults as jest.Mock).mockResolvedValue(undefined)

    const result = await extractRaceResults({ year: 2023 })

    // Should only include the working event hash
    expect(result).toEqual({
      year: 2023,
      eventHashes: ['event1']
    })

    // Should only save results for the working event
    expect(mockData.update.rawAthletesRaceResults).toHaveBeenCalledTimes(1)

    // Check that logger.error was called for the failed event
    expect(mockLoggerInstance.error).toHaveBeenCalledWith(
      'Error while processing event results: Error: Failed to get event results',
      expect.objectContaining({
        hash: 'event2',
        year: 2023,
        error: expect.any(Error)
      })
    )
  })

  it('should handle save failures gracefully', async () => {
    const mockEventResults = createMockEventResults(baseMockEvent1)
    const saveError = new Error('Database save failed')

    ;(mockData.get.events as jest.Mock).mockResolvedValue([baseMockEvent1])
    ;(mockData.get.eventResults as jest.Mock).mockResolvedValue(mockEventResults)
    ;(mockData.update.rawAthletesRaceResults as jest.Mock).mockRejectedValue(saveError)

    // Should not throw, error should be handled gracefully
    const result = await extractRaceResults({ year: 2023 })

    expect(result).toEqual({
      year: 2023,
      eventHashes: ['event1']
    })

    // Check that logger.error was called for the save failure
    expect(mockLoggerInstance.error).toHaveBeenCalledWith(
      'Error while saving athletes race results: Error: Database save failed',
      expect.objectContaining({
        hash: 'event1',
        year: 2023,
        error: expect.any(Error)
      })
    )
  })

  it('should process athletes with valid names but no UCI ID', async () => {
    const athleteNoUciIdButValidName = {
      ...baseMockAthlete1,
      uciId: '',
      firstName: 'Valid',
      lastName: 'Name'
    }

    const mockEventResults = createMockEventResults(baseMockEvent1,
        { '1': athleteNoUciIdButValidName }
      )

    ;(mockData.get.events as jest.Mock).mockResolvedValue([baseMockEvent1])
    ;(mockData.get.eventResults as jest.Mock).mockResolvedValue(mockEventResults)
    ;(mockData.update.rawAthletesRaceResults as jest.Mock).mockResolvedValue(undefined)

    await extractRaceResults({ year: 2023 })

    // Should include athlete with empty UCI ID but valid name
    expect(mockData.update.rawAthletesRaceResults).toHaveBeenCalledWith(
      [
        createExpectedRaceResult(baseMockAthlete1, baseMockEvent1, {
          athleteUciId: '', // Empty UCI ID should be preserved
          firstName: 'Valid',
          lastName: 'Name'
        })
      ],
      { eventHash: 'event1', year: 2023 }
    )
  })

  it('should handle athlete name validation scenarios correctly', async () => {
    // Test Case 1: Has UCI ID + undefined names → should process
    const athleteUndefinedNames = {
      ...baseMockAthlete1,
      uciId: '12345678901',
      firstName: undefined,
      lastName: undefined
    }

    // Test Case 2: No UCI ID + partial names → should warn and skip  
    const athletePartialName = {
      ...baseMockAthlete1,
      uciId: '',
      firstName: 'OnlyFirst',
      lastName: '' // Missing last name
    }

    // Test Case 3: No UCI ID + completely missing names → should skip silently
    const athleteNoIdNoNames = {
      ...baseMockAthlete1,
      uciId: '',
      firstName: '',
      lastName: ''
    }

    // Test each scenario separately
    const scenarios = [
      {
        name: 'undefined names with UCI ID',
        athlete: athleteUndefinedNames,
        expectedResults: [
          createExpectedRaceResult(baseMockAthlete1, baseMockEvent1, {
            athleteUciId: '12345678901',
            firstName: undefined,
            lastName: undefined
          })
        ],
        shouldWarn: false
      },
      {
        name: 'partial names without UCI ID',
        athlete: athletePartialName,
        expectedResults: [],
        shouldWarn: true,
        expectedWarning: 'Athlete OnlyFirst  has no UCI ID and partial name, skipping race extraction'
      },
      {
        name: 'missing names without UCI ID',
        athlete: athleteNoIdNoNames,
        expectedResults: [],
        shouldWarn: false
      }
    ]

    for (const scenario of scenarios) {
      // Setup mocks for this scenario
      jest.clearAllMocks()
      clearLoggerMocks()

      const mockEventResults = createMockEventResults(baseMockEvent1,
        { '1': scenario.athlete }
      )

      ;(mockData.get.events as jest.Mock).mockResolvedValue([baseMockEvent1])
      ;(mockData.get.eventResults as jest.Mock).mockResolvedValue(mockEventResults)
      ;(mockData.update.rawAthletesRaceResults as jest.Mock).mockResolvedValue(undefined)

      await extractRaceResults({ year: 2023 })

      // Verify results
      expect(mockData.update.rawAthletesRaceResults).toHaveBeenCalledWith(
        scenario.expectedResults,
        { eventHash: 'event1', year: 2023 }
      )

      // Verify warning behavior
      if (scenario.shouldWarn) {
        expect(mockLoggerInstance.warn).toHaveBeenCalledWith(
          scenario.expectedWarning,
          expect.objectContaining({
            eventHash: 'event1'
          })
        )
      } else {
        expect(mockLoggerInstance.warn).not.toHaveBeenCalled()
      }
    }
  })
})