import {
  Alert,
  Anchor,
  Table, Text,
} from '@mantine/core'
import { useContext, useMemo } from 'react'
import * as React from 'react'
import { EmptyState } from '../../Shared/EmptyState'
import { AppContext } from '../../AppContext'
import { renderSkillLevelWithAgeCategory } from '../../Athlete/utils'
import { useNavigator } from '../../utils/useNavigator'
import type { Athlete, AthleteCompilations } from '../../types/athletes'

const currentYear = new Date().getFullYear()

type RecentlyUpgradedAthletesTableProps = {
  recentlyUpgradedAthletes?: AthleteCompilations['recentlyUpgradedAthletes']
}

type RecentlyUpgradedAthlete = AthleteCompilations['recentlyUpgradedAthletes'][0]

export const RecentlyUpgradedAthletesTable: React.FC<RecentlyUpgradedAthletesTableProps> = ({
  recentlyUpgradedAthletes
}) => {
  const { navigateToAthlete } = useNavigator()
  const { athletes } = useContext(AppContext)

  const shapedAthletes = useMemo(() => {
    const sortedAthletes: Array<Athlete & RecentlyUpgradedAthlete> = []

    recentlyUpgradedAthletes?.filter(({ discipline }) => discipline === 'ROAD').forEach(upgradedAthlete => {
      const athlete = athletes.get(upgradedAthlete.athleteUciId)
      if (athlete) {
        sortedAthletes.push({
          ...athlete,
          ...upgradedAthlete,
        })
      }
    })

    return sortedAthletes.sort((a, b) => {
      const nameA = `${a.firstName} ${a.lastName}`.toLowerCase()
      const nameB = `${b.firstName} ${b.lastName}`.toLowerCase()
      return nameA.localeCompare(nameB)
    })
  }, [athletes, recentlyUpgradedAthletes])

  const rows = useMemo(() => shapedAthletes.map((upgrade) => {
    const team = upgrade.team?.[currentYear]

    return (
      <Table.Tr key={`athlete-${upgrade.uciId}`}>
        <Table.Td>
          <Anchor onClick={() => navigateToAthlete(upgrade.uciId)}>
            {upgrade.firstName} {upgrade.lastName?.toUpperCase()}
          </Anchor>

          <Text size="sm" c="dimmed" hiddenFrom="sm" style={{
            overflow: 'hidden',
            whiteSpace: 'nowrap', textOverflow: 'ellipsis',
          }}>{team?.name}</Text>
        </Table.Td>
        <Table.Td visibleFrom="sm">
          {team?.name}
        </Table.Td>
        <Table.Td
          style={{ textAlign: 'center' }}>{renderSkillLevelWithAgeCategory({ skillLevel: { ROAD: upgrade.skillLevel } }, 'ROAD')}
        </Table.Td>
        <Table.Td>{upgrade.date}</Table.Td>
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
                <Table.Th style={{ width: 110 }}>Date</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>{rows}</Table.Tbody>
          </Table>
        ) : (
          <EmptyState>No recently upgraded athletes</EmptyState>
        )}
      </div>

      <Alert variant="light" style={{ marginTop: '1rem' }}>
        Note: the date is an approximation of the upgrade week. Upgrades are processed weekly (generally on Wednesdays),
        so the date may not be exact.
      </Alert>
    </>
  )
}