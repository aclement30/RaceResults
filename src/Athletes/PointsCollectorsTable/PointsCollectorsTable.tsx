import {
  Alert,
  Anchor, Badge, Group,
  Table, Text, Tooltip,
} from '@mantine/core'
import { useContext, useMemo } from 'react'
import * as React from 'react'
import { EmptyState } from '../../Shared/EmptyState'
import { AppContext } from '../../AppContext'
import { renderSkillLevelWithAgeCategory } from '../../Athlete/utils'
import { useNavigator } from '../../utils/useNavigator'
import type { Athlete, AthleteCompilations } from '../../types/athletes'
import { IconCircleCheck } from '@tabler/icons-react'

const currentYear = new Date().getFullYear()

type PointsCollectorsTableProps = {
  pointsCollectors?: AthleteCompilations['pointsCollectors']
}

type PointsCollector = AthleteCompilations['pointsCollectors'][0]

export const PointsCollectorsTable: React.FC<PointsCollectorsTableProps> = ({
  pointsCollectors
}) => {
  const { navigateToAthlete } = useNavigator()
  const { athletes } = useContext(AppContext)

  const shapedAthletes = useMemo(() => {
    const sortedAthletes: Array<Athlete & PointsCollector> = []

    pointsCollectors?.filter(({ discipline }) => discipline === 'ROAD').forEach(upgradedAthlete => {
      const athlete = athletes.get(upgradedAthlete.athleteUciId)
      if (athlete) {
        sortedAthletes.push({
          ...athlete,
          ...upgradedAthlete,
        })
      }
    })

    // Sort athletes by total points (UPGRADE + SUBJECTIVE) in descending order
    return sortedAthletes.sort((a, b) => {
      const totalPointsA = a.points.UPGRADE + a.points.SUBJECTIVE
      const totalPointsB = b.points.UPGRADE + b.points.SUBJECTIVE
      return totalPointsA > totalPointsB ? -1 : 1
    })
  }, [athletes, pointsCollectors])

  const rows = useMemo(() => shapedAthletes.map((upgrade) => {
    const team = upgrade.team?.[currentYear]

    return (
      <Table.Tr key={`athlete-${upgrade.uciId}`} className={upgrade.hasRacedUp ? '-dimmed' : ''}>
        <Table.Td>
          <Anchor onClick={() => navigateToAthlete(upgrade.uciId, 'points')}>
            <Group gap="xs" style={{ flexWrap: 'nowrap' }}>
              {upgrade.firstName} {upgrade.lastName?.toUpperCase()}
              {!!upgrade.hasRacedUp && (
                <Tooltip label="This athlete has raced up a category recently.">
                  <IconCircleCheck size={16}/>
                </Tooltip>
              )}
            </Group>

            <Text size="sm" c="dimmed" hiddenFrom="sm" style={{
              overflow: 'hidden',
              whiteSpace: 'nowrap', textOverflow: 'ellipsis',
            }}>{team?.name}</Text>
          </Anchor>
        </Table.Td>
        <Table.Td visibleFrom="sm">
          {team?.name}
        </Table.Td>
        <Table.Td
          style={{ textAlign: 'center' }}>{renderSkillLevelWithAgeCategory({ skillLevel: { ROAD: upgrade.skillLevel } }, 'ROAD')}</Table.Td>
        <Table.Td>
          <Group justify="flex-end" gap="sm">
            {(upgrade.points.SUBJECTIVE > 0) &&
              <Tooltip label="Subjective Points"><Badge size="md"
                                                        variant="light">{upgrade.points.SUBJECTIVE}</Badge></Tooltip>}
            {(upgrade.points.UPGRADE > 0) &&
              <Tooltip label="Upgrade Points"><Badge size="md">{upgrade.points.UPGRADE}</Badge></Tooltip>}
          </Group>
        </Table.Td>
      </Table.Tr>
    )
  }), [shapedAthletes])

  return (
    <>
      <div style={{ width: '100%', marginTop: '1rem' }}>
        {!!rows.length ? (
          <Table style={{ tableLayout: 'fixed' }} withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th visibleFrom="sm">Team</Table.Th>
                <Table.Th style={{ width: 50, textAlign: 'center' }}>
                  Cat<span className="mantine-visible-from-sm">egory</span>
                </Table.Th>
                <Table.Th style={{ width: 120, textAlign: 'right' }}>Points</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>{rows}</Table.Tbody>
          </Table>
        ) : (
          <EmptyState>No points collectors found</EmptyState>
        )}
      </div>

      <Alert variant="light" style={{ marginTop: '1rem' }}>
        This list includes athletes who have
        accumulated at least 60 upgrade points in the last
        12 months, or since their last upgrade, whichever is more recent.
      </Alert>
    </>
  )
}