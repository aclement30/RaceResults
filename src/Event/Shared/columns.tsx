import type { EventAthlete, AthleteRaceResult, AthleteSerieResult } from '../../types/results'
import { Badge, Tooltip } from '@mantine/core'
import { formatTimeDuration, formatGapTime, formatSpeed } from '../../utils/race-results'


export const formatRacerPositionLabel = (position: number, textOnly?: boolean) => {
  if (position > 3 || textOnly) return position

  const badgeColour = position === 1 ? 'gold' : position === 2 ? 'silver' : 'brown'

  return <Badge color={badgeColour} style={{ paddingLeft: 6, paddingRight: 5 }}>{position}</Badge>
}

type ColumnOptions = {
  text?: boolean
}

function renderEmptyValue(empty: string, textOnly?: boolean) {
  if (textOnly) return null
  else return empty
}

export const columns = {
  position: (row: Pick<AthleteRaceResult, 'status' | 'position'>, { text }: ColumnOptions = {}) => {
    return row.status === 'FINISHER' ? formatRacerPositionLabel(row.position, text) : row.status
  },
  city: (row: Pick<EventAthlete, 'city' | 'province'>) => {
    return [row.city, row.province].filter(Boolean).join(', ')
  },
  bibNumber: (row: Pick<AthleteRaceResult | AthleteSerieResult, 'bibNumber'> | {
    bibNumber: number
  }, { text, onClick }: ColumnOptions & { onClick?: (bibNumber: number) => void } = {}) => {
    if (text) return row.bibNumber

    return <Badge
      size="lg"
      variant="gradient"
      gradient={{ from: 'blue', to: 'cyan', deg: 90 }}
      style={{ borderRadius: 5, overflow: 'visible', cursor: onClick ? 'pointer' : 'default' }}
      styles={{ label: { overflow: 'visible' } }}
      onClick={() => onClick?.(row.bibNumber!)}
    >
      {row.bibNumber}
    </Badge>
  },
  time: (row: Pick<AthleteRaceResult, 'status' | 'position' | 'finishTime' | 'finishGap'>, {
    text,
    showGapTime
  }: ColumnOptions & {
    showGapTime?: boolean
  } = {}) => {
    if (!['FINISHER', 'DNF'].includes(row.status) || row.status === 'DNF' && row.finishTime === 0) return renderEmptyValue('-', text)

    if (row.position === 1 || ( !showGapTime && row.status === 'FINISHER' && row.finishGap >= 0 )) {
      const duration = formatTimeDuration(row.finishTime)
      if (duration === '-') return renderEmptyValue('-', text)
      return duration
    } else if (row.status === 'DNF' || row.finishGap < 0) return `(${formatTimeDuration(row.finishTime)})`
    else {
      if (text) {
        const value = formatGapTime(row.finishGap)
        if (value === '-') return renderEmptyValue('-', text)
        return value
      }

      return <Tooltip
        label={formatTimeDuration(row.finishTime)}><span>{formatGapTime(row.finishGap)}</span></Tooltip>
    }
  },
  gap: (row: Pick<AthleteRaceResult, 'status' | 'finishGap'>, { text }: ColumnOptions = {}) => {
    if (!['FINISHER', 'DNF'].includes(row.status)) return renderEmptyValue('-', text)

    const value = formatGapTime(row.finishGap)
    if (value === '-') return renderEmptyValue('-', text)
    return value
  },
  avgSpeed: (row: Pick<AthleteRaceResult, 'status' | 'avgSpeed'>, { text }: ColumnOptions = {}) => {
    if (!['FINISHER', 'DNF'].includes(row.status) || !row.avgSpeed) return renderEmptyValue('-', text)

    const value = formatSpeed(row.avgSpeed)
    if (value === '-') return renderEmptyValue('-', text)
    return value
  },
}