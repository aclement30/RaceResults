import {
  ActionIcon,
  Alert,
  Anchor,
  Badge, Button,
  Checkbox,
  Group,
  Table,
  Text,
  Tooltip
} from '@mantine/core'
import { useEffect, useMemo, useState } from 'react'
import type { Athlete, AthleteUpgradePoint } from '../../types/athletes'
import { useNavigate, useSearchParams } from 'react-router'
import { columns } from '../../Event/Shared/columns'
import { getSanctionedEventTypeLabel, hasDoubleUpgradePoints } from '../../Event/utils'
import { Dropdown } from '../../Shared/Dropdown'
import { getActiveUpgradePointsTotal } from '../utils'
import { ExplanationPopover } from './ExplanationPopover'
import * as React from 'react'
import { UpgradePointExplanation } from '../../Event/Shared/UpgradePointExplanation'
import { IconChevronDown, IconChevronUp, IconFileDownload } from '@tabler/icons-react'
import { EmptyState } from '../../Shared/EmptyState'
import { exportCSV } from '../../utils/exportCSV'
import { CONFIDENCE_LEVEL_THRESHOLD, isUpgradePointStale } from '../../utils/upgrade-points'

type ResultsTableProps = {
  skillLevel: Athlete['skillLevel']
  upgradePoints?: AthleteUpgradePoint[]
  latestUpgrade?: Athlete['latestUpgrade']
}

const oneYearAgo = new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toLocaleDateString('sv', { timeZone: 'America/Vancouver' }).slice(0, 10)

export const UpgradePointsTable: React.FC<ResultsTableProps> = ({
  skillLevel,
  upgradePoints,
  latestUpgrade,
}) => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedPointType = (searchParams.get('pointType') || 'ALL') as 'ALL' | 'UPGRADE' | 'SUBJECTIVE'
  const selectedDiscipline: 'ROAD' | 'CX' = (searchParams.get('discipline') || 'ROAD') as 'ROAD' | 'CX'
  const [selectedRows, setSelectedRows] = useState<string[]>([])
  const [openedRow, setOpenedRow] = useState<string | null>(null)
  const [loadingCsv, setLoadingCsv] = useState(false)

  useEffect(() => {
    let selectedRows: string[] = []
    // Only select rows if there is no latest upgrade date or if the latest upgrade date has a good confidence level. Otherwise let the user select the rows manually.
    if (!latestUpgrade?.[selectedDiscipline] || latestUpgrade?.[selectedDiscipline]?.confidence && latestUpgrade[selectedDiscipline].confidence >= CONFIDENCE_LEVEL_THRESHOLD) {
      selectedRows = upgradePoints?.filter(point => !isUpgradePointStale(point.date, latestUpgrade?.[point.discipline])).map(point => point.eventHash) || []
    }
    setSelectedRows(selectedRows)
  }, [upgradePoints, latestUpgrade, selectedDiscipline])

  const totalActivePoints = useMemo(() => {
    const last12MonthsPoints = upgradePoints?.filter(upgradePoint => upgradePoint.date >= oneYearAgo && upgradePoint.discipline === selectedDiscipline) || []

    const filteredRows = last12MonthsPoints.filter(upgradePoint => selectedRows.includes(upgradePoint.eventHash)) || []

    return getActiveUpgradePointsTotal(filteredRows, selectedDiscipline)
  }, [
    upgradePoints,
    selectedDiscipline,
    selectedRows
  ])

  const disciplines = useMemo(() => [...new Set(upgradePoints?.map(p => p.discipline) || [])], [upgradePoints])

  const filteredUpgradePoints = useMemo(() => {
    let last12MonthsPoints = upgradePoints?.filter(upgradePoint => upgradePoint.date >= oneYearAgo) || []
    last12MonthsPoints = last12MonthsPoints
    .filter(upgradePoint => upgradePoint.discipline === selectedDiscipline)
    .sort((a, b) => b.date > a.date ? 1 : -1)

    if (selectedPointType === 'ALL') return last12MonthsPoints

    return last12MonthsPoints.filter(upgradePoint => upgradePoint.type === selectedPointType)
  }, [upgradePoints, selectedPointType, selectedDiscipline])

  const oldestPointDate = useMemo(() => {
    if (!filteredUpgradePoints.length) return null
    return filteredUpgradePoints[filteredUpgradePoints.length - 1].date
  }, [filteredUpgradePoints])

  const handleToggleRow = (eventHash: string) => {
    setOpenedRow((prevOpened) => (prevOpened === eventHash ? null : eventHash))
  }

  const handleSelectAll = () => {
    setSelectedRows((prevSelected) => {
      if (prevSelected.length === filteredUpgradePoints.length) {
        return []
      } else {
        return filteredUpgradePoints.map(upgradePoint => upgradePoint.eventHash)
      }
    })
  }

  const handleSelect = (eventHash: string) => {
    setSelectedRows((prevSelected) => {
      if (prevSelected.includes(eventHash)) {
        return prevSelected.filter((hash) => hash !== eventHash)
      } else {
        return [...prevSelected, eventHash]
      }
    })
  }

  const rows = useMemo(() => filteredUpgradePoints.map((upgradePoint) => {
    const year = +upgradePoint.date.slice(0, 4)
    const isDoubleUpgradePoints = !!upgradePoint.eventType && hasDoubleUpgradePoints(upgradePoint.eventType)
    const staleUpgradePoint = isUpgradePointStale(upgradePoint.date, latestUpgrade?.[upgradePoint.discipline])

    return (<>
        <Table.Tr key={`upgrade-point-${upgradePoint.eventHash}`}
                  className={staleUpgradePoint ? '-dimmed' : ''}>
          <Table.Td>
            <Checkbox checked={selectedRows.includes(upgradePoint.eventHash)}
                      onChange={() => handleSelect(upgradePoint.eventHash)}/>
          </Table.Td>
          <Table.Td visibleFrom="sm">{upgradePoint.date}</Table.Td>
          <Table.Td>
            <Anchor
              onClick={() => navigate(`/events/${year}/${upgradePoint.eventHash}?category=${upgradePoint.category}`)}>
              {upgradePoint.eventName}
            </Anchor>
            <Text c="dimmed" size="sm" hiddenFrom="sm">{upgradePoint.date}</Text>
          </Table.Td>
          <Table.Td visibleFrom="sm">{getSanctionedEventTypeLabel(upgradePoint.eventType || null)}</Table.Td>
          <Table.Td style={{ textAlign: 'center' }}>{columns.position({
            position: upgradePoint.position,
            status: 'FINISHER'
          })}</Table.Td>
          <Table.Td visibleFrom="sm">
            {upgradePoint.type === 'UPGRADE' ? <Badge>Upgrade</Badge> :
              <Badge variant="light">Subjective</Badge>}
          </Table.Td>
          <Table.Td style={{ textAlign: 'right' }}>
            <Group gap={5} style={{ justifyContent: 'flex-end' }}>
              <span className="mantine-visible-from-sm">{upgradePoint.points}</span>

              {upgradePoint.type === 'UPGRADE' ? <Badge variant="filled" hiddenFrom="sm">{upgradePoint.points}</Badge> :
                <Badge variant="light" hiddenFrom="sm">{upgradePoint.points}</Badge>}

              <ActionIcon variant="transparent" aria-label="Points Explanation" hiddenFrom="sm"
                          onClick={() => handleToggleRow(upgradePoint.eventHash)}>
                {openedRow === upgradePoint.eventHash ?
                  <IconChevronUp/> :
                  <IconChevronDown/>}
              </ActionIcon>

              <ExplanationPopover pointType={upgradePoint.type} fieldSize={upgradePoint.fieldSize}
                                  eventTypeLabel={getSanctionedEventTypeLabel(upgradePoint.eventType)}
                                  isDoubleUpgradePoints={isDoubleUpgradePoints}
              />
            </Group>
          </Table.Td>
        </Table.Tr>

        <Table.Tr key={`upgrade-point-${upgradePoint.eventHash}-points-explanation`} hiddenFrom="sm"
                  style={{ display: openedRow === upgradePoint.eventHash ? 'table-row' : 'none' }}>
          <Table.Td colSpan={4} p={0}>
            <Alert p="xs">
              <UpgradePointExplanation
                fieldSize={upgradePoint.fieldSize} eventTypeLabel={getSanctionedEventTypeLabel(upgradePoint.eventType)}
                isDoubleUpgradePoints={isDoubleUpgradePoints}
              >
                <Text size="sm" fw={500}
                      mb="xs">{upgradePoint.type === 'UPGRADE' ? ' Upgrade Points' : 'Subjective Points'}</Text>
              </UpgradePointExplanation>
            </Alert>
          </Table.Td>
        </Table.Tr>
      </>
    )
  }), [filteredUpgradePoints, selectedRows, openedRow])

  const handleExportCSV = async () => {
    const selectedUpgradePoints = filteredUpgradePoints?.filter(upgradePoint => selectedRows.includes(upgradePoint.eventHash)) || []

    const exportedRows = selectedUpgradePoints.map((row) => {
      return [
        row.eventName,
        row.date,
        getSanctionedEventTypeLabel(row.eventType),
        row.categoryLabel,
        row.fieldSize,
        row.position,
        row.points,
        `${window.location.origin}/events/${row.date.slice(0, 4)}/${row.eventHash}?category=${row.category}`
      ]
    })

    setLoadingCsv(true)

    try {
      await exportCSV(exportedRows, [
        'EventName',
        'EventDate',
        'SanctionLevel',
        'Category',
        'FieldSize',
        'Result',
        'Points',
        'Link',
      ], 'upgrade-points')
    } catch (error) {
      // @ts-ignore
      showErrorMessage({ title: 'CSV Export Error', message: error.message })
    } finally {
      setLoadingCsv(false)
    }
  }

  const handleSelectDiscipline = (discipline: 'ROAD' | 'CX') => {
    const updatedParams = new URLSearchParams(searchParams)
    updatedParams.set('discipline', discipline)
    setSearchParams(updatedParams)
  }

  const handleSelectPointType = (pointType: 'ALL' | 'UPGRADE' | 'SUBJECTIVE') => {
    const updatedParams = new URLSearchParams(searchParams)
    updatedParams.set('pointType', pointType)
    setSearchParams(updatedParams)
  }

  return (
    <div style={{ width: '100%', marginTop: '1rem' }}>
      <Group style={{ paddingBottom: '1rem' }} justify="space-between">
        <Group>
          {disciplines.length > 1 && (
            <Dropdown
              items={[
                { value: 'ROAD', label: 'Road' },
                { value: 'CX', label: 'Cyclocross' }
              ]}
              size="sm"
              onSelect={handleSelectDiscipline}
              value={selectedDiscipline}
            />
          )}

          <Dropdown
            items={[
              { value: 'ALL', label: 'All' },
              { value: 'UPGRADE', label: 'Upgrade' },
              { value: 'SUBJECTIVE', label: 'Subjective' }
            ]}
            size="sm"
            onSelect={handleSelectPointType}
            value={selectedPointType}
          />

          {!!selectedRows.length && (
            <Group justify="flex-end" gap="sm">
              {(selectedPointType === 'ALL' || selectedPointType === 'UPGRADE') &&
                <Tooltip label="Upgrade Points"><Badge size="xl">{totalActivePoints.UPGRADE}</Badge></Tooltip>}
              {(selectedPointType === 'ALL' || selectedPointType === 'SUBJECTIVE') &&
                <Tooltip label="Subjective Points"><Badge size="xl"
                                                          variant="light">{totalActivePoints.SUBJECTIVE}</Badge></Tooltip>}
            </Group>
          )}
        </Group>

        <Button
          variant="default"
          leftSection={<IconFileDownload/>}
          onClick={() => handleExportCSV()}
          loading={loadingCsv}
          visibleFrom="sm"
          disabled={!selectedRows.length}
        >
          Download CSV
        </Button>
      </Group>

      {filteredUpgradePoints.length > 0 ? (
        <Table style={{ tableLayout: 'fixed' }} withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th style={{ width: 40 }}>
                <Checkbox checked={selectedRows.length === filteredUpgradePoints.length}
                          onChange={() => handleSelectAll()}/>
              </Table.Th>
              <Table.Th style={{ width: 110 }} visibleFrom="sm">Date</Table.Th>
              <Table.Th>Race</Table.Th>
              <Table.Th visibleFrom="sm"
                        style={{ width: 130 }}>Event Type</Table.Th>
              <Table.Th hiddenFrom="sm" style={{
                width: 40,
                textAlign: 'center'
              }}>P</Table.Th>
              <Table.Th visibleFrom="sm" style={{
                width: 80,
                textAlign: 'center'
              }}>Position</Table.Th>
              <Table.Th visibleFrom="sm"
                        style={{ width: 120 }}>Type</Table.Th>
              <Table.Th style={{ width: 95, textAlign: 'right' }}>Points</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>{rows}</Table.Tbody>
        </Table>
      ) : (
        <EmptyState>No points found</EmptyState>
      )}

      {latestUpgrade?.[selectedDiscipline] && oldestPointDate && latestUpgrade?.[selectedDiscipline]?.date > oldestPointDate && (
        <Alert variant="light" style={{ marginTop: '1rem' }}>
          {latestUpgrade[selectedDiscipline].confidence >= CONFIDENCE_LEVEL_THRESHOLD ? (
            <>
              Last category upgrade
              to cat {skillLevel?.[selectedDiscipline]}: {latestUpgrade?.[selectedDiscipline]?.date} (estimated)
            </>
          ) : (
            <>This athlete has recently
              upgraded
              {skillLevel?.[selectedDiscipline] ? ` to cat ${skillLevel?.[selectedDiscipline]}` : ''}. Some
              of the above
              upgrade points
              may be related to the previous category.
            </>
          )}
        </Alert>
      )}
    </div>
  )
}