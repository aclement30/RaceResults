export function formatTimeDuration(seconds: number): string {
  if (seconds >= 3600) {
    return new Date(seconds * 1000).toISOString().slice(11, 19)
  } else {
    return new Date(seconds * 1000).toISOString().slice(14, 19)
  }
}

export function formatGapTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)

  if (seconds >= 3600) {
    // Response format should be hh mm'ss"
    // const minutes = Math.floor((seconds % 3600) / 60)
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes
    const formattedSeconds = remainingSeconds < 10 ? `0${remainingSeconds}` : remainingSeconds

    return `+ ${hours}h ${formattedMinutes}' ${formattedSeconds}"`
  } else if (seconds >= 60) {
    // Response format should be mm'ss"
    const formattedSeconds = remainingSeconds < 10 ? `0${remainingSeconds}` : remainingSeconds

    return `+ ${minutes}' ${formattedSeconds}"`
  } else {
    if (remainingSeconds < 0) return '-'

    // Response format should be ss"
    return `+ ${remainingSeconds}"`
  }
}

export function formatSpeed(speed: number) {
  return speed.toFixed(2)
}