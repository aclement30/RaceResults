import type { Athlete, AthleteRaceResult, AthleteSerieResult } from '../../types/results'
import { Badge, Tooltip } from '@mantine/core'
import { formatTimeDuration, formatGapTime, formatSpeed } from '../../utils/race-results'


export const formatRacerPositionLabel = (position: number) => {
  if (position > 3) return position

  const badgeColour = position === 1 ? 'gold' : position === 2 ? 'silver' : 'brown'

  return <Badge color={badgeColour} style={{ paddingLeft: 6, paddingRight: 5 }}>{position}</Badge>
}

export const columns = {
  position: (row: Pick<AthleteRaceResult, 'status' | 'position'>) => {
    return row.status === 'FINISHER' ? formatRacerPositionLabel(row.position) : row.status
  },
  city: (row: Pick<Athlete, 'city' | 'state'>) => {
    return [row.city, row.state].filter(Boolean).join(', ')
  },
  bibNumber: (row: Pick<AthleteRaceResult | AthleteSerieResult, 'bibNumber'> | { bibNumber: number }) => {
    return <Badge
      size="lg"
      variant="gradient"
      gradient={{ from: 'blue', to: 'cyan', deg: 90 }}
      style={{ borderRadius: 5, overflow: 'visible' }}
      styles={{ label: { overflow: 'visible' } }}
    >
      {row.bibNumber}
    </Badge>
  },
  time: (row: Pick<AthleteRaceResult, 'status' | 'position' | 'finishTime' | 'finishGap'>, { showGapTime }: {
    showGapTime?: boolean
  }) => {
    if (!['FINISHER', 'DNF'].includes(row.status) || row.status === 'DNF' && row.finishTime === 0) return '-'

    if (row.position === 1 || ( !showGapTime && row.status === 'FINISHER' && row.finishGap >= 0 )) return formatTimeDuration(row.finishTime)
    else if (row.status === 'DNF' || row.finishGap < 0) return `(${formatTimeDuration(row.finishTime)})`
    else return <Tooltip
        label={formatTimeDuration(row.finishTime)}><span>{formatGapTime(row.finishGap)}</span></Tooltip>
  },
  gap: (row: Pick<AthleteRaceResult, 'status' | 'finishGap'>) => {
    if (!['FINISHER', 'DNF'].includes(row.status)) return '-'

    return formatGapTime(row.finishGap)
  },
  avgSpeed: (row: Pick<AthleteRaceResult, 'status' | 'avgSpeed'>) => {
    if (!['FINISHER', 'DNF'].includes(row.status)) return '-'

    return row.avgSpeed ? formatSpeed(row.avgSpeed) : '-'
  },
}