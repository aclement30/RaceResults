import type { Athlete, AthleteUpgradePoint } from '../types/athletes.ts'
import { Anchor } from '@mantine/core'
import type { ReactNode } from 'react'

const currentYear = new Date().getFullYear()

export const getActiveUpgradePointsTotal = (
  upgradePoints: AthleteUpgradePoint[] | undefined,
  discipline: 'ROAD' | 'CX'
) => {
  return upgradePoints?.filter(({
    discipline: pointDiscipline
  }) => pointDiscipline === discipline).reduce((acc, { points, type }) => {
    acc[type] = acc[type] + points
    return acc
  }, { UPGRADE: 0, SUBJECTIVE: 0 }) || { UPGRADE: 0, SUBJECTIVE: 0 }
}

export const renderSkillLevelWithAgeCategory = (
  athlete: Pick<Athlete, 'skillLevel' | 'ageCategory'>,
  discipline: 'ROAD' | 'CX' = 'ROAD'
): string | null => {
  const { skillLevel, ageCategory } = athlete

  if (!skillLevel?.[discipline]) return null

  let text = `${skillLevel?.[discipline]}`

  if (ageCategory?.[discipline] && ageCategory[discipline] !== 'ELITE') text += ' / ' + getAgeCategoryLabel(ageCategory[discipline])

  return text
}

export const getAgeCategoryLabel = (ageCategory: string): string => {
  switch (ageCategory) {
    case 'JUNIOR':
      return 'Junior'
    case 'ELITE':
      return 'Elite'
    case 'MASTER':
      return 'Master'
    default:
      return ageCategory.toUpperCase()
  }
}

export const displayAthleteCurrentTeam = (athlete: Athlete, onClick?: (teamId: number) => void): ReactNode => {
  let label = 'Independent'
  let teamId = null

  if (athlete.team?.[currentYear]) {
    label = athlete.team[currentYear].name!
    teamId = athlete.team[currentYear].id
  } else if (athlete.team?.[currentYear - 1]) {
    label = `(${athlete.team[currentYear - 1].name!})`
    teamId = athlete.team[currentYear - 1].id
  }

  if (onClick && teamId) {
    return (
      <Anchor onClick={() => onClick(teamId)}>
        {label}
      </Anchor>
    )
  } else {
    return label
  }
}