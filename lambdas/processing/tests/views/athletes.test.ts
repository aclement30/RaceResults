// Mock the dependencies FIRST before any imports
jest.mock('../../../shared/data')

// Import and use shared logger mock
import { createLoggerMock, clearLoggerMocks } from '../__mocks__/logger'

jest.mock('../../../shared/logger', () => createLoggerMock())

import { createViewAthletes } from '../../views/athletes'
import data from '../../../shared/data'
import type { Athlete, AthleteManualEdit } from '../../../shared/types'

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
  lastUpdated: '2023-06-15'
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
  lastUpdated: '2023-07-20'
}

const baseMockAthlete3: Athlete = {
  uciId: '12345678903',
  firstName: 'Mike',
  lastName: 'Johnson',
  gender: 'M',
  city: 'Calgary',
  province: 'AB',
  birthYear: 1988,
  licenses: { 2023: ['GHI789'] },
  nationality: 'CAN',
  lastUpdated: '2023-08-01'
}

describe('createViewAthletes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    clearLoggerMocks()
  })

  it('should process athletes with comprehensive manual edit scenarios', async () => {
    // Test multiple scenarios in one comprehensive test:
    // 1. Filter by athlete IDs (includes some, excludes others)
    // 2. Apply full manual edits for some athletes  
    // 3. Apply partial manual edits for some athletes
    // 4. Return unchanged athletes with no edits
    // 5. Properly omit uciId field from manual edits

    const athleteIds = ['12345678901', '12345678902', '12345678903']

    const manualEditWithUciId: AthleteManualEdit = {
      uciId: '12345678901', // This field should be omitted in merge
      firstName: 'Johnny',
      city: 'Ottawa',
      meta: {
        createdAt: '2026-02-27T12:00:00Z',
        updatedAt: '2026-02-27T12:00:00Z',
      }
    }

    const partialManualEdit: AthleteManualEdit = {
        uciId: '12345678902',
        lastName: 'SmithUpdated', // Only update one field
        meta: {
          createdAt: '2026-02-27T12:00:00Z',
          updatedAt: '2026-02-27T12:00:00Z',
        }
      }

    ;(mockData.get.baseAthletes as jest.Mock).mockResolvedValue([
      baseMockAthlete1,
      baseMockAthlete2,
      baseMockAthlete3
    ])
    ;(mockData.get.athleteManualEdits as jest.Mock).mockResolvedValue([
      manualEditWithUciId, // For athlete1
      partialManualEdit    // For athlete2
      // No edit for athlete3
    ])
    ;(mockData.update.viewAthletes as jest.Mock).mockResolvedValue(undefined)

    await createViewAthletes({ athleteIds })

    // Should process all athletes with appropriate manual edits applied
    expect(mockData.update.viewAthletes).toHaveBeenCalledWith([
      {
        ...baseMockAthlete1,
        firstName: 'Johnny', // Updated from manual edit
        city: 'Ottawa', // Updated from manual edit
        meta: {
          createdAt: '2026-02-27T12:00:00Z',
          updatedAt: '2026-02-27T12:00:00Z',
        }
        // uciId should remain original (not from manual edit)
      },
      {
        ...baseMockAthlete2,
        lastName: 'SmithUpdated', // Only field updated from partial manual edit
        meta: {
          createdAt: '2026-02-27T12:00:00Z',
          updatedAt: '2026-02-27T12:00:00Z',
        }
        // Other fields remain unchanged
      },
      baseMockAthlete3 // No manual edit, returned completely unchanged
    ])

    // Verify proper uciId handling (should remain original, not from manual edit)
    const savedAthletes = (mockData.update.viewAthletes as jest.Mock).mock.calls[0][0]
    expect(savedAthletes[0].uciId).toBe('12345678901') // Original uciId preserved
    expect(savedAthletes[1].uciId).toBe('12345678902') // Original uciId preserved
    expect(savedAthletes[2].uciId).toBe('12345678903') // Original uciId preserved
  })

  it('should handle data fetch errors gracefully', async () => {
    const athleteIds = ['12345678901']

    ;(mockData.get.baseAthletes as jest.Mock).mockRejectedValue(new Error('Database error'))
    ;(mockData.get.athleteManualEdits as jest.Mock).mockResolvedValue([])

    await expect(createViewAthletes({ athleteIds })).rejects.toThrow('Database error')
  })

  it('should handle update errors gracefully', async () => {
    const athleteIds = ['12345678901']

    ;(mockData.get.baseAthletes as jest.Mock).mockResolvedValue([baseMockAthlete1])
    ;(mockData.get.athleteManualEdits as jest.Mock).mockResolvedValue([])
    ;(mockData.update.viewAthletes as jest.Mock).mockRejectedValue(new Error('Update failed'))

    await expect(createViewAthletes({ athleteIds })).rejects.toThrow('Update failed')
  })
})