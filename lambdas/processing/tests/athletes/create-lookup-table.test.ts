// Mock the dependencies FIRST before any imports
jest.mock('../../../shared/data')

// Import and use shared logger mock
import { createLoggerMock, clearLoggerMocks } from '../__mocks__/logger'

jest.mock('../../../shared/logger', () => createLoggerMock())

import { createAthleteLookupTable } from '../../athletes/create-lookup-table'
import data from '../../../shared/data'

const mockData = data as jest.Mocked<typeof data>

describe('createAthleteLookupTable', () => {
  // Shared base mock objects
  const baseMockAthlete = {
    uciId: '12345678901',
    firstName: 'John',
    lastName: 'Doe',
    gender: 'M' as const,
    birthYear: 1990,
    nationality: 'CAN',
    city: 'Toronto',
    province: 'ON',
    skillLevel: { ROAD: '1' },
    ageCategory: { ROAD: 'elite' },
    licenses: { '2023': ['ABC123'] },
    lastUpdated: '2023-06-15'
  }

  const baseMockOverrides = {
    alternateNames: {},
    replacedUciIds: {},
    levelUpgradeDates: {},
    athleteData: {},
    ignoredTeams: []
  }

  beforeEach(() => {
    clearLoggerMocks()
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should create lookup table with athletes', async () => {
    // Arrange
    const athletes = [
      { ...baseMockAthlete },
      { ...baseMockAthlete, uciId: '12345678902', firstName: 'Jane', lastName: 'Smith' },
      { ...baseMockAthlete, uciId: '12345678903', firstName: 'Bob', lastName: 'Wilson' }
    ];
    (mockData.get.baseAthletes as jest.Mock).mockResolvedValue(athletes);
    (mockData.get.athletesOverrides as jest.Mock).mockResolvedValue(baseMockOverrides);
    (mockData.update.athletesLookup as jest.Mock).mockResolvedValue(undefined)

    // Act
    await createAthleteLookupTable()

    // Assert
    expect(mockData.get.baseAthletes).toHaveBeenCalledTimes(1)
    expect(mockData.get.athletesOverrides).toHaveBeenCalledTimes(1)
    expect(mockData.update.athletesLookup).toHaveBeenCalledTimes(1)

    const [lookupTable, duplicates] = (mockData.update.athletesLookup as jest.Mock).mock.calls[0]

    expect(lookupTable).toEqual({
      'john|doe': '12345678901',
      'jane|smith': '12345678902',
      'bob|wilson': '12345678903'
    })
    expect(duplicates).toEqual({})
  })

  it('should handle athletes with null/undefined names', async () => {
    // Arrange
    const athletes = [
      { ...baseMockAthlete, firstName: null, lastName: 'Doe' },
      { ...baseMockAthlete, uciId: '12345678902', firstName: 'John', lastName: null },
      { ...baseMockAthlete, uciId: '12345678903', firstName: undefined, lastName: undefined }
    ];
    (mockData.get.baseAthletes as jest.Mock).mockResolvedValue(athletes);
    (mockData.get.athletesOverrides as jest.Mock).mockResolvedValue(baseMockOverrides);
    (mockData.update.athletesLookup as jest.Mock).mockResolvedValue(undefined)

    // Act
    await createAthleteLookupTable()

    // Assert
    const [lookupTable] = (mockData.update.athletesLookup as jest.Mock).mock.calls[0]

    expect(lookupTable).toEqual({
      '|doe': '12345678901',
      'john|': '12345678902',
      '|': '12345678903'
    })
  })

  it('should handle duplicate names and track conflicts', async () => {
    // Arrange - Two athletes with same name
    const athletes = [
      { ...baseMockAthlete, uciId: '12345678901', firstName: 'John', lastName: 'Doe' },
      { ...baseMockAthlete, uciId: '12345678902', firstName: 'John', lastName: 'Doe' },
      { ...baseMockAthlete, uciId: '12345678903', firstName: 'Jane', lastName: 'Smith' }
    ];
    (mockData.get.baseAthletes as jest.Mock).mockResolvedValue(athletes);
    (mockData.get.athletesOverrides as jest.Mock).mockResolvedValue(baseMockOverrides);
    (mockData.update.athletesLookup as jest.Mock).mockResolvedValue(undefined)

    // Act
    await createAthleteLookupTable()

    // Assert
    const [lookupTable, duplicates] = (mockData.update.athletesLookup as jest.Mock).mock.calls[0]

    // The duplicate entry should be removed from lookup table entirely (new behavior)
    expect(lookupTable).toEqual({
      'jane|smith': '12345678903' // Only the non-duplicate entry remains
    })

    // Duplicates are now stored as arrays of UCI IDs by key
    expect(duplicates).toEqual({
      'john|doe': ['12345678902', '12345678901'] // Array of conflicting UCI IDs
    })
  })

  it('should add alternate names from overrides', async () => {
    // Arrange
    const athletes = [
      { ...baseMockAthlete, firstName: 'John', lastName: 'Doe' }
    ]
    const overrides = {
      ...baseMockOverrides,
      alternateNames: {
        'johnny|doe': '12345678901',
        'j|doe': '12345678901',
        'jane|smith': '12345678902'
      }
    };
    (mockData.get.baseAthletes as jest.Mock).mockResolvedValue(athletes);
    (mockData.get.athletesOverrides as jest.Mock).mockResolvedValue(overrides);
    (mockData.update.athletesLookup as jest.Mock).mockResolvedValue(undefined)

    // Act
    await createAthleteLookupTable()

    // Assert
    const [lookupTable] = (mockData.update.athletesLookup as jest.Mock).mock.calls[0]

    expect(lookupTable).toEqual({
      'john|doe': '12345678901',
      'johnny|doe': '12345678901',
      'j|doe': '12345678901',
      'jane|smith': '12345678902'
    })
  })

  it('should skip duplicate alternate names and warn', async () => {
    // Arrange
    const athletes = [
      { ...baseMockAthlete, firstName: 'John', lastName: 'Doe' }
    ]
    const overrides = {
      ...baseMockOverrides,
      alternateNames: {
        'john|doe': '12345678902' // Conflicts with existing entry
      }
    };
    (mockData.get.baseAthletes as jest.Mock).mockResolvedValue(athletes);
    (mockData.get.athletesOverrides as jest.Mock).mockResolvedValue(overrides);
    (mockData.update.athletesLookup as jest.Mock).mockResolvedValue(undefined)

    // Act
    await createAthleteLookupTable()

    // Assert
    const [lookupTable] = (mockData.update.athletesLookup as jest.Mock).mock.calls[0]

    // The alternate name should be skipped, original entry remains (new behavior)
    expect(lookupTable).toEqual({
      'john|doe': '12345678901' // Original UCI ID remains, alternate name is skipped
    })
  })

  it('should handle overrides without alternate names', async () => {
    // Arrange
    const athletes = [
      { ...baseMockAthlete, firstName: 'John', lastName: 'Doe' }
    ]
    const overrides = {
      ...baseMockOverrides,
      alternateNames: undefined
    };
    (mockData.get.baseAthletes as jest.Mock).mockResolvedValue(athletes);
    (mockData.get.athletesOverrides as jest.Mock).mockResolvedValue(overrides);
    (mockData.update.athletesLookup as jest.Mock).mockResolvedValue(undefined)

    // Act
    await createAthleteLookupTable()

    // Assert - Should not crash and work normally
    const [lookupTable] = (mockData.update.athletesLookup as jest.Mock).mock.calls[0]

    expect(lookupTable).toEqual({
      'john|doe': '12345678901'
    })
  })

  it('should handle save errors gracefully', async () => {
    // Arrange
    const athletes = [
      { ...baseMockAthlete, firstName: 'John', lastName: 'Doe' }
    ];
    (mockData.get.baseAthletes as jest.Mock).mockResolvedValue(athletes);
    (mockData.get.athletesOverrides as jest.Mock).mockResolvedValue(baseMockOverrides);
    (mockData.update.athletesLookup as jest.Mock).mockRejectedValue(new Error('Database save failed'))

    // Act
    await createAthleteLookupTable()

    // Assert - Should not throw and should log error
    expect(mockData.update.athletesLookup).toHaveBeenCalledTimes(1)
  })

  it('should handle multiple duplicates with same name', async () => {
    // Arrange - Three athletes with same name
    const athletes = [
      { ...baseMockAthlete, uciId: '12345678901', firstName: 'John', lastName: 'Doe' },
      { ...baseMockAthlete, uciId: '12345678902', firstName: 'John', lastName: 'Doe' },
      { ...baseMockAthlete, uciId: '12345678903', firstName: 'John', lastName: 'Doe' },
      { ...baseMockAthlete, uciId: '12345678904', firstName: 'Jane', lastName: 'Smith' }
    ];
    (mockData.get.baseAthletes as jest.Mock).mockResolvedValue(athletes);
    (mockData.get.athletesOverrides as jest.Mock).mockResolvedValue(baseMockOverrides);
    (mockData.update.athletesLookup as jest.Mock).mockResolvedValue(undefined)

    // Act
    await createAthleteLookupTable()

    // Assert
    const [lookupTable, duplicates] = (mockData.update.athletesLookup as jest.Mock).mock.calls[0]

    // All duplicates should be excluded from lookup table (new behavior with else if)
    expect(lookupTable).toEqual({
      'jane|smith': '12345678904' // Only non-duplicate remains
    })

    // All three conflicting UCI IDs should be tracked in duplicates array
    expect(duplicates).toEqual({
      'john|doe': ['12345678902', '12345678901', '12345678903'] // All three in array
    })
  })

  it('should handle empty first name and last name combinations', async () => {
    // Arrange
    const athletes = [
      { ...baseMockAthlete, uciId: '12345678901', firstName: '', lastName: 'Doe' },
      { ...baseMockAthlete, uciId: '12345678902', firstName: 'John', lastName: '' },
      { ...baseMockAthlete, uciId: '12345678903', firstName: '', lastName: '' },
      { ...baseMockAthlete, uciId: '12345678904', firstName: 'Jane', lastName: 'Smith' }
    ];
    (mockData.get.baseAthletes as jest.Mock).mockResolvedValue(athletes);
    (mockData.get.athletesOverrides as jest.Mock).mockResolvedValue(baseMockOverrides);
    (mockData.update.athletesLookup as jest.Mock).mockResolvedValue(undefined)

    // Act
    await createAthleteLookupTable()

    // Assert
    const [lookupTable] = (mockData.update.athletesLookup as jest.Mock).mock.calls[0]

    expect(lookupTable).toEqual({
      '|doe': '12345678901',      // Empty first name
      'john|': '12345678902',     // Empty last name  
      '|': '12345678903',         // Both empty
      'jane|smith': '12345678904' // Normal case
    })
  })

  it('should handle whitespace-only names', async () => {
    // Arrange
    const athletes = [
      { ...baseMockAthlete, uciId: '12345678901', firstName: '  ', lastName: 'Doe' },
      { ...baseMockAthlete, uciId: '12345678902', firstName: 'John', lastName: '   ' },
      { ...baseMockAthlete, uciId: '12345678903', firstName: '  \t  ', lastName: '  \n  ' }
    ];
    (mockData.get.baseAthletes as jest.Mock).mockResolvedValue(athletes);
    (mockData.get.athletesOverrides as jest.Mock).mockResolvedValue(baseMockOverrides);
    (mockData.update.athletesLookup as jest.Mock).mockResolvedValue(undefined)

    // Act
    await createAthleteLookupTable()

    // Assert
    const [lookupTable] = (mockData.update.athletesLookup as jest.Mock).mock.calls[0]

    // .trim() is applied to the whole key after concatenation
    expect(lookupTable).toEqual({
      '|doe': '12345678901',      // "  |doe".trim() = "|doe"
      'john|': '12345678902',     // "john|   ".trim() = "john|"  
      '|': '12345678903'          // "  \t  |  \n  ".trim() = "|"
    })
  })

  it('should handle case-insensitive matching', async () => {
    // Arrange
    const athletes = [
      { ...baseMockAthlete, uciId: '12345678901', firstName: 'JOHN', lastName: 'DOE' },
      { ...baseMockAthlete, uciId: '12345678902', firstName: 'john', lastName: 'doe' },
      { ...baseMockAthlete, uciId: '12345678903', firstName: 'John', lastName: 'Doe' }
    ];
    (mockData.get.baseAthletes as jest.Mock).mockResolvedValue(athletes);
    (mockData.get.athletesOverrides as jest.Mock).mockResolvedValue(baseMockOverrides);
    (mockData.update.athletesLookup as jest.Mock).mockResolvedValue(undefined)

    // Act
    await createAthleteLookupTable()

    // Assert
    const [lookupTable, duplicates] = (mockData.update.athletesLookup as jest.Mock).mock.calls[0]

    // All should be considered duplicates due to case-insensitive matching (new behavior)
    expect(lookupTable).toEqual({}) // All entries removed due to conflicts

    // All three should be tracked as duplicates in array
    expect(duplicates).toEqual({
      'john|doe': ['12345678902', '12345678901', '12345678903']
    })
  })

  it('should handle alternate names when no conflicts exist', async () => {
    // Arrange
    const athletes = [
      { ...baseMockAthlete, uciId: '12345678901', firstName: 'John', lastName: 'Doe' }
    ]
    const overrides = {
      ...baseMockOverrides,
      alternateNames: {
        'johnny|doe': '12345678901',
        'j|doe': '12345678901',
        'jane|smith': '12345678902'  // Different athlete not in main list
      }
    };
    (mockData.get.baseAthletes as jest.Mock).mockResolvedValue(athletes);
    (mockData.get.athletesOverrides as jest.Mock).mockResolvedValue(overrides);
    (mockData.update.athletesLookup as jest.Mock).mockResolvedValue(undefined)

    // Act
    await createAthleteLookupTable()

    // Assert
    const [lookupTable] = (mockData.update.athletesLookup as jest.Mock).mock.calls[0]

    expect(lookupTable).toEqual({
      'john|doe': '12345678901',     // Original athlete
      'johnny|doe': '12345678901',   // Alternate name for same athlete
      'j|doe': '12345678901',        // Another alternate name
      'jane|smith': '12345678902'    // Alternate name for different athlete
    })
  })

  it('should properly track duplicates with new array-based system', async () => {
    // Arrange - Test the new duplicate tracking system specifically
    const athletes = [
      { ...baseMockAthlete, uciId: '11111111111', firstName: 'Alice', lastName: 'Smith' },
      { ...baseMockAthlete, uciId: '22222222222', firstName: 'Alice', lastName: 'Smith' }, // First duplicate
      { ...baseMockAthlete, uciId: '33333333333', firstName: 'Alice', lastName: 'Smith' }, // Second duplicate  
      { ...baseMockAthlete, uciId: '44444444444', firstName: 'Alice', lastName: 'Smith' }, // Third duplicate
      { ...baseMockAthlete, uciId: '55555555555', firstName: 'Bob', lastName: 'Jones' }
    ];
    (mockData.get.baseAthletes as jest.Mock).mockResolvedValue(athletes);
    (mockData.get.athletesOverrides as jest.Mock).mockResolvedValue(baseMockOverrides);
    (mockData.update.athletesLookup as jest.Mock).mockResolvedValue(undefined)

    // Act
    await createAthleteLookupTable()

    // Assert
    const [lookupTable, duplicates] = (mockData.update.athletesLookup as jest.Mock).mock.calls[0]

    // Only non-duplicate should remain in lookup
    expect(lookupTable).toEqual({
      'bob|jones': '55555555555'
    })

    // All Alice Smith duplicates should be tracked in array
    expect(duplicates).toEqual({
      'alice|smith': ['22222222222', '11111111111', '33333333333', '44444444444']
    })
  })
})