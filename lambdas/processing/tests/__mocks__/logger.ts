// Shared logger mock that can be reused across test files
export const mockLoggerInstance = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}

export const createLoggerMock = () => ({
  __esModule: true,
  default: {
    child: jest.fn(() => mockLoggerInstance)
  }
})
  
// Helper to clear logger mock calls
export const clearLoggerMocks = () => {
  mockLoggerInstance.info.mockClear()
  mockLoggerInstance.warn.mockClear()
  mockLoggerInstance.error.mockClear()
}