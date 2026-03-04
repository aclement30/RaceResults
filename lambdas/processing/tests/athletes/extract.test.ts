// Mock the dependencies FIRST before any imports
jest.mock('../../../shared/data')

// Import and use shared logger mock
import { createLoggerMock, mockLoggerInstance, clearLoggerMocks } from '../__mocks__/logger'

jest.mock('../../../shared/logger', () => createLoggerMock())

jest.mock('../../config', () => ({
  DEFAULT_EVENT_FILTERS: { location: { country: 'CA', province: 'BC' } },
}))

import { extractAthletes } from '../../athletes/extract'
import data from '../../../shared/data'
import type { EventResults, EventSummary } from '../../../shared/types'

const mockData = data as jest.Mocked<typeof data>

// Base mock data that can be reused and extended
const baseMockEvent1: EventSummary = {
  hash: 'event1',
  year: 2023,
  date: '2023-06-15',
  name: 'Test Event 1',
  location: { country: 'CA', province: 'ON', city: 'Toronto' },
  sanctionedEventType: 'A',
  discipline: 'ROAD',
  organizerAlias: 'test-organizer'
}

const baseMockEvent2: EventSummary = {
  hash: 'event2',
  year: 2023,
  date: '2023-07-20',
  name: 'Test Event 2',
  location: { country: 'CA', province: 'BC', city: 'Vancouver' },
  sanctionedEventType: 'AA',
  discipline: 'CX',
  organizerAlias: 'test-organizer'
}

const baseMockEvents = [baseMockEvent1, baseMockEvent2]

const baseMockAthlete1 = {
  uciId: '12345678901',
  firstName: 'john',
  lastName: 'doe',
  gender: 'M' as const,
  city: 'toronto',
  province: 'on',
  license: 'ABC123',
  age: 33,
  nationality: 'can',
  bibNumber: '1',
  team: undefined
}

const baseMockAthlete2 = {
  uciId: '12345678902',
  firstName: 'jane',
  lastName: 'smith',
  gender: 'F' as const,
  city: 'vancouver',
  province: 'bc',
  license: 'DEF456',
  age: 38,
  nationality: 'can',
  bibNumber: '2',
  team: undefined
}

const createMockEventResults = (
  event: EventSummary,
  athletes: Record<string, any> = { 'athlete1': baseMockAthlete1 }
): EventResults => ({
  hash: event.hash,
  athletes,
  results: {},
  sourceUrls: [],
  lastUpdated: event.date
})

describe('extractAthletes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    clearLoggerMocks()
  })

  it('should extract athletes from multiple events successfully', async () => {
    const mockEventResults1 = createMockEventResults(baseMockEvent1)
    const mockEventResults2 = createMockEventResults(baseMockEvent2, { 'athlete2': baseMockAthlete2 })

    ;(mockData.get.events as jest.Mock).mockResolvedValue(baseMockEvents)
    ;(mockData.get.eventResults as jest.Mock)
    .mockResolvedValueOnce(mockEventResults1)
    .mockResolvedValueOnce(mockEventResults2)
    ;(mockData.update.rawEventAthletes as jest.Mock).mockResolvedValue(undefined)

    const result = await extractAthletes({ year: 2023 })

    expect(result).toEqual({
      eventHashes: ['event1', 'event2']
    })

    expect(mockData.get.events).toHaveBeenCalledWith({
      location: { country: 'CA', province: 'BC' },
      year: 2023,
    })
    expect(mockData.get.eventResults).toHaveBeenCalledTimes(2)
    expect(mockData.update.rawEventAthletes).toHaveBeenCalledTimes(2)

    // Check that athletes from both events were processed
    expect(mockData.update.rawEventAthletes).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
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
        })
      ]),
      { eventHash: 'event1', year: 2023 }
    )
  })

  it('should pass eventHash filter to data.get.events', async () => {
    const specificEvent = { ...baseMockEvent1, hash: 'specific-event' }
    const mockEvents = [specificEvent]
    const mockEventResults = createMockEventResults(specificEvent, {})

    ;(mockData.get.events as jest.Mock).mockResolvedValue(mockEvents)
    ;(mockData.get.eventResults as jest.Mock).mockResolvedValue(mockEventResults)
    ;(mockData.update.rawEventAthletes as jest.Mock).mockResolvedValue(undefined)

    await extractAthletes({ year: 2023, eventHash: 'specific-event' })

    expect(mockData.get.events).toHaveBeenCalledWith({
      location: { country: 'CA', province: 'BC' },
      year: 2023,
      eventHash: 'specific-event'
    })
  })

  it('should filter out athletes with invalid data (UCI ID, missing names)', async () => {
    const invalidUciIdAthlete = { ...baseMockAthlete1, uciId: 'INVALID_UCI_ID' }
    const noUciIdAthlete = { ...baseMockAthlete2, uciId: '' }
    const noFirstNameAthlete = { ...baseMockAthlete1, uciId: '12345678903', firstName: '', bibNumber: '3' }
    const noLastNameAthlete = { ...baseMockAthlete2, uciId: '12345678904', lastName: '', bibNumber: '4' }

    const mockEvents = [baseMockEvent1]
    const mockEventResults = createMockEventResults(baseMockEvent1, {
        'athlete1': invalidUciIdAthlete,
        'athlete2': noUciIdAthlete,
        'athlete3': noFirstNameAthlete,
        'athlete4': noLastNameAthlete
      })

    ;(mockData.get.events as jest.Mock).mockResolvedValue(mockEvents)
    ;(mockData.get.eventResults as jest.Mock).mockResolvedValue(mockEventResults)
    ;(mockData.update.rawEventAthletes as jest.Mock).mockResolvedValue(undefined)

    const result = await extractAthletes({ year: 2023 })

    expect(result).toEqual({
      eventHashes: ['event1']
    })

    // All invalid athletes should be filtered out, so empty array
    expect(mockData.update.rawEventAthletes).toHaveBeenCalledWith(
      [],
      { eventHash: 'event1', year: 2023 }
    )
  })

  it('should exclude TEMP licenses', async () => {
    const mockEvents = [baseMockEvent1]
    const tempLicenseAthlete = { ...baseMockAthlete1, license: 'TEMP' }
    const mockEventResults = createMockEventResults(baseMockEvent1, { 'athlete1': tempLicenseAthlete })

    ;(mockData.get.events as jest.Mock).mockResolvedValue(mockEvents)
    ;(mockData.get.eventResults as jest.Mock).mockResolvedValue(mockEventResults)
    ;(mockData.update.rawEventAthletes as jest.Mock).mockResolvedValue(undefined)

    await extractAthletes({ year: 2023 })

    expect(mockData.update.rawEventAthletes).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          uciId: '12345678901',
          licenses: {} // TEMP license should be excluded
        })
      ]),
      { eventHash: 'event1', year: 2023 }
    )
  })

  it('should skip duplicate athletes', async () => {
    const mockEvents = [baseMockEvent1]
    const athlete1 = { ...baseMockAthlete1 }
    const athlete2 = { ...baseMockAthlete1, license: 'XYZ789', bibNumber: '2' } // Same UCI ID
    const mockEventResults = createMockEventResults(baseMockEvent1, {
        'athlete1': athlete1,
        'athlete2': athlete2
      })

    ;(mockData.get.events as jest.Mock).mockResolvedValue(mockEvents)
    ;(mockData.get.eventResults as jest.Mock).mockResolvedValue(mockEventResults)
    ;(mockData.update.rawEventAthletes as jest.Mock).mockResolvedValue(undefined)

    await extractAthletes({ year: 2023 })

    expect(mockData.update.rawEventAthletes).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          uciId: '12345678901',
          licenses: { 2023: ['ABC123'] }
        })
      ]),
      { eventHash: 'event1', year: 2023 }
    )

    const savedAthletes = (mockData.update.rawEventAthletes as jest.Mock).mock.calls[0][0]
    expect(savedAthletes).toHaveLength(1)
  })

  it('should handle event extraction errors gracefully', async () => {
    const event1 = { ...baseMockEvent1 }
    const event2 = { ...baseMockEvent1, hash: 'event2', date: '2023-07-20' }
    const mockEvents = [event1, event2]

    ;(mockData.get.events as jest.Mock).mockResolvedValue(mockEvents)
    ;(mockData.get.eventResults as jest.Mock)
    .mockResolvedValueOnce(createMockEventResults(event1))
    .mockRejectedValueOnce(new Error('Failed to fetch event results'))
    ;(mockData.update.rawEventAthletes as jest.Mock).mockResolvedValue(undefined)

    const result = await extractAthletes({ year: 2023 })

    expect(result).toEqual({
      eventHashes: ['event1']
    })

    expect(mockData.update.rawEventAthletes).toHaveBeenCalledTimes(1)

    // Check that logger.error was called for the failed event
    expect(mockLoggerInstance.error).toHaveBeenCalledWith(
      'Error while processing event athletes: Error: Failed to fetch event results',
      expect.objectContaining({
        hash: 'event2',
        year: 2023,
        error: expect.any(Error)
      })
    )
  })

  it('should handle save errors gracefully', async () => {
    const mockEvents = [baseMockEvent1]
    const mockEventResults = createMockEventResults(baseMockEvent1)

    ;(mockData.get.events as jest.Mock).mockResolvedValue(mockEvents)
    ;(mockData.get.eventResults as jest.Mock).mockResolvedValue(mockEventResults)
    ;(mockData.update.rawEventAthletes as jest.Mock).mockRejectedValue(new Error('Save failed'))

    const result = await extractAthletes({ year: 2023 })

    expect(result).toEqual({
      eventHashes: ['event1']
    })

    // Check that logger.error was called due to the save failure
    expect(mockLoggerInstance.error).toHaveBeenCalledWith(
      expect.stringContaining('Error while saving raw athletes'),
      expect.objectContaining({ error: expect.any(Error) })
    )
  })

  it('should handle birth year calculation from age and missing age', async () => {
    const athleteWithAge = { ...baseMockAthlete1, age: 25, uciId: '12345678905', bibNumber: '5' }
    const athleteNoAge = { ...baseMockAthlete2, age: undefined, uciId: '12345678906', bibNumber: '6' }

    const mockEvents = [baseMockEvent1]
    const mockEventResults = createMockEventResults(baseMockEvent1, {
        'athlete1': athleteWithAge,
        'athlete2': athleteNoAge
      })

    ;(mockData.get.events as jest.Mock).mockResolvedValue(mockEvents)
    ;(mockData.get.eventResults as jest.Mock).mockResolvedValue(mockEventResults)
    ;(mockData.update.rawEventAthletes as jest.Mock).mockResolvedValue(undefined)

    await extractAthletes({ year: 2023 })

    expect(mockData.update.rawEventAthletes).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          uciId: '12345678905',
          birthYear: 1998 // 2023 - 25 = 1998
        }),
        expect.objectContaining({
          uciId: '12345678906',
          birthYear: undefined
        })
      ]),
      { eventHash: 'event1', year: 2023 }
    )
  })
})