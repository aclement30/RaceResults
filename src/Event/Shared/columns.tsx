import { Anchor, Badge, Tooltip } from '@mantine/core'
import type { Athlete, ParticipantResult, ParticipantSerieEventResult } from '../../../shared/types'
import { formatGapTime, formatSpeed, formatTimeDuration } from '../../utils/race-results'

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
  position: (row: Pick<ParticipantResult, 'status' | 'position'>, { text }: ColumnOptions = {}) => {
    return row.status === 'FINISHER' && row.position ? formatRacerPositionLabel(row.position, text) : row.status
  },
  name: (row: Partial<Pick<ParticipantResult, 'firstName' | 'lastName' | 'uciId'>>, {
    text,
    short,
    onClick
  }: ColumnOptions & {
    short?: boolean
    onClick?: (uciId: string) => void
  } = {}) => {
    if (!row.firstName && !row.lastName) return null

    if (!row.lastName) return row.firstName

    const textLabel = short ? `${row.lastName?.toUpperCase()}, ${row.firstName?.slice(0, 1)}` : `${row.lastName?.toUpperCase()}, ${row.firstName}`

    if (text || !row.uciId || !onClick) return textLabel

    return <Anchor size="sm" onClick={() => onClick?.(row.uciId!)}>{textLabel}</Anchor>
  },
  city: (row: Pick<Athlete, 'city' | 'province'>) => {
    return [row.city, row.province].filter(Boolean).join(', ')
  },
  bibNumber: (row: Pick<ParticipantResult | ParticipantSerieEventResult, 'bibNumber'> | {
    bibNumber: number
  }, { text, onClick }: ColumnOptions & { onClick?: (bibNumber: number) => void } = {}) => {
    if (text) return row.bibNumber

    if (!row.bibNumber) return null

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
  time: (row: Pick<ParticipantResult, 'status' | 'position' | 'finishTime' | 'finishGap'>, {
    text,
    showGapTime
  }: ColumnOptions & {
    showGapTime?: boolean
  } = {}) => {
    if (!row.status) return renderEmptyValue('-', text)

    if (![
      'FINISHER',
      'DNF'
    ].includes(row.status) || row.status === 'DNF' && row.finishTime === 0) return renderEmptyValue('-', text)

    if (row.position === 1 || (!showGapTime && row.status === 'FINISHER' && row.finishGap && row.finishGap >= 0)) {
      const duration = row.finishTime ? formatTimeDuration(row.finishTime) : '-'
      if (duration === '-') return renderEmptyValue('-', text)
      return duration
    } else if (row.status === 'DNF' || row.finishGap !== undefined && row.finishGap < 0) return row.finishTime ? `(${formatTimeDuration(row.finishTime)})` : '-'
    else {
      if (text) {
        const value = formatGapTime(row.finishGap!)
        if (value === '-') return renderEmptyValue('-', text)
        return value
      }

      return <Tooltip
        label={!!row.finishTime && formatTimeDuration(row.finishTime)}><span>{formatGapTime(row.finishGap!)}</span></Tooltip>
    }
  },
  gap: (row: Pick<ParticipantResult, 'status' | 'finishGap'>, { text }: ColumnOptions = {}) => {
    if (!row.status || !['FINISHER', 'DNF'].includes(row.status) || !row.finishGap) return renderEmptyValue('-', text)

    const value = formatGapTime(row.finishGap)
    if (value === '-') return renderEmptyValue('-', text)
    return value
  },
  avgSpeed: (row: Pick<ParticipantResult, 'status' | 'avgSpeed'>, { text }: ColumnOptions = {}) => {
    if (!row.status || !['FINISHER', 'DNF'].includes(row.status) || !row.avgSpeed) return renderEmptyValue('-', text)

    const value = formatSpeed(row.avgSpeed)
    if (value === '-') return renderEmptyValue('-', text)
    return value
  },
}