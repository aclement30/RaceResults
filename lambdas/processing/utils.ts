export const validateUCIId = (uciId: string): boolean => {
  // UCI ID should be a string of 11 digits
  return !!uciId.match(/^\d{11}$/)
}