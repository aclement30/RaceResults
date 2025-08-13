export const CONFIDENCE_LEVEL_THRESHOLD = 0.5

export const isUpgradePointStale = (
  date: string,
  latestUpgrade?: { date: string, confidence: number } | null,
): boolean => {
  // If no latest upgrade or confidence is below threshold, do not consider it stale
  if (!latestUpgrade?.confidence || latestUpgrade?.confidence < CONFIDENCE_LEVEL_THRESHOLD) return false

  // Check if the date is before the latest upgrade date
  return !!latestUpgrade?.date && date < latestUpgrade?.date
}
