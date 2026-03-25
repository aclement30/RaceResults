import { Alert, Button, Group, Table, Text } from '@mantine/core'
import { IconFileDownload } from '@tabler/icons-react'
import { useContext, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import type { EventResults, RaceEvent } from '../../../shared/types'
import { AppContext } from '../../AppContext'
import { UserFavoriteContext } from '../../UserFavoriteContext'
import { exportCSV } from '../../utils/exportCSV'
import { showErrorMessage } from '../../utils/showErrorMessage'
import { useNavigator } from '../../utils/useNavigator'
import { columns } from '../Shared/columns'
import { UpgradePointExplanation } from '../Shared/UpgradePointExplanation'
import { getCategoriesWithLabels, getSanctionedEventTypeLabel, } from '../utils'

type PointsTableProps = {
  eventSummary: RaceEvent
  eventResults: EventResults
  selectedCategory: string
}

export const PointsTable: React.FC<PointsTableProps> = ({
  eventSummary,
  eventResults,
  selectedCategory: selectedCategoryAlias,
}) => {
  const { findAthlete } = useContext(AppContext)
  const { isFavorite } = useContext(UserFavoriteContext)

  const { navigateToAthlete } = useNavigator()
  const [searchParams, setSearchParams] = useSearchParams()
  const eventYear = +eventSummary.date.slice(0, 4)

  const handleSelectCategory = (categoryAlias: string) => {
    const updatedParams = new URLSearchParams(searchParams)
    updatedParams.set('category', categoryAlias)

    setSearchParams(updatedParams)
  }

  const selectedCategory = useMemo(() => selectedCategoryAlias ? eventResults.categories.find(c => c.alias === selectedCategoryAlias) : undefined, [
    eventResults.categories,
    selectedCategoryAlias
  ])

  const combinedCategoriesWithLabels = useMemo(() => {
    let subCategories: string[] = []

    if (!selectedCategory) return {}

    if (selectedCategory.parentCategory) {
      subCategories = eventResults.categories.filter(c => selectedCategory.parentCategory === c.alias).map(c => c.alias) || []
    } else {
      subCategories = [selectedCategory.alias]
    }

    return getCategoriesWithLabels(subCategories, eventResults.categories)
  }, [eventResults, selectedCategory])

  const pointType = eventSummary.hasUpgradePoints
  const eventTypeLabel = getSanctionedEventTypeLabel(eventSummary.sanctionedEventType)
  const [loadingCsv, setLoadingCsv] = useState(false)

  const athleteColumns = useMemo(() => {
    const resultAthletes = selectedCategory?.upgradePoints?.map((point) => selectedCategory.results.find(r => r.participantId === point.participantId))
    const athleteColumns = ['name']

    if (resultAthletes?.some(result => !!result?.team?.length)) athleteColumns.push('team')
    if (resultAthletes?.some(result => !!result?.bibNumber)) athleteColumns.push('bibNumber')

    return athleteColumns
  }, [selectedCategory?.upgradePoints, selectedCategory?.results])

  const rows = useMemo(() => selectedCategory?.upgradePoints?.map((pointEntry) => {
    const participant = selectedCategory?.results.find(r => r.participantId === pointEntry.participantId)!
    const athleteProfile = findAthlete(participant)
    const team = participant.team || athleteProfile?.teams?.[eventYear]?.name
    const isFavoriteRow = isFavorite({ athleteUciId: athleteProfile?.uciId, team })

    return (
      <Table.Tr key={`ranking-${pointEntry.participantId}`} className={`result-row ${isFavoriteRow ? 'favorite' : ''}`}>
        <Table.Td>{columns.position({ status: 'FINISHER', position: pointEntry.position })}</Table.Td>
        <Table.Td>
          {columns.name(athleteProfile || participant, { onClick: athleteProfile ? navigateToAthlete : undefined })}
          {athleteColumns.includes('team') && (<Text size="sm" c="dimmed" hiddenFrom="sm" style={{
            overflow: 'hidden',
            whiteSpace: 'nowrap', textOverflow: 'ellipsis',
          }}>{team}</Text>)}
        </Table.Td>
        {athleteColumns.includes('team') && (<Table.Td visibleFrom="sm">{team}</Table.Td>)}
        {athleteColumns.includes('bibNumber') && (<Table.Td>{columns.bibNumber(participant)}</Table.Td>)}
        <Table.Td style={{ textAlign: 'center' }}>{pointEntry.points}</Table.Td>
      </Table.Tr>
    )
  }), [selectedCategory, athleteColumns])

  const handleExportCSV = async () => {
    const exportedRows = selectedCategory?.upgradePoints?.map((pointEntry) => {
      const participant = selectedCategory?.results.find(r => r.participantId === pointEntry.participantId)!
      return [
        columns.position({ status: 'FINISHER', position: participant.position }, { text: true }) as string,
        columns.name(participant, { text: true }) as string,
        participant.team,
        participant.bibNumber?.toString(),
        pointEntry.points.toString(),
      ]
    })

    setLoadingCsv(true)

    try {
      await exportCSV(exportedRows || [], [
        'Position',
        'Name',
        'Team',
        'BibNumber',
        'Points',
      ], 'points')
    } catch (error) {
      showErrorMessage({ title: 'CSV Export Error', message: (error as any).message })
    } finally {
      setLoadingCsv(false)
    }
  }

  return (
    <div style={{ width: '100%', marginTop: '1rem' }}>
      <Group style={{ paddingBottom: '1rem', justifyContent: 'flex-end' }} visibleFrom="sm">
        <Button
          variant="default"
          leftSection={<IconFileDownload/>}
          onClick={() => handleExportCSV()}
          data-umami-event="export-event-points-csv"
          loading={loadingCsv}>
          Download CSV
        </Button>
      </Group>

      <Table style={{ tableLayout: 'fixed' }} withTableBorder>
        <Table.Thead>
          <Table.Tr>
            <Table.Th hiddenFrom="sm" style={{
              width: 40
            }}>P</Table.Th>
            <Table.Th visibleFrom="sm" style={{
              width: 80
            }}>Position</Table.Th>
            <Table.Th>Name</Table.Th>
            {athleteColumns.includes('team') && (<Table.Th visibleFrom="sm">Team</Table.Th>)}
            {athleteColumns.includes('bibNumber') && (<Table.Th style={{
              width: 70
            }}>Bib</Table.Th>)}
            <Table.Th style={{
              width: 100,
              textAlign: 'center',
            }}>Points</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>

      <Alert
        variant="light"
        color="blue"
        style={{ margin: '1rem 0' }}
        title={pointType === 'UPGRADE' ? 'Upgrade Points' : 'Subjective Upgrade Points'}
      >
        <UpgradePointExplanation
          fieldSize={selectedCategory?.fieldSize}
          combinedCategories={combinedCategoriesWithLabels}
          selectedCategory={selectedCategory?.alias}
          onCategoryClick={handleSelectCategory}
          eventTypeLabel={eventTypeLabel}
          isDoubleUpgradePoints={eventSummary.isDoubleUpgradePoints}
        >
          {pointType === 'UPGRADE' ? (
            <>
              Upgrade points are awarded based on the Cycling BC Upgrade Points Schedule and the finishing position of
              each athletes. This is an estimate and may not reflect the final points awarded by Cycling BC.
            </>
          ) : (
            <>
              Subjective upgrade points are awarded based on the Cycling BC Upgrade Points Schedule and the finishing
              position of each
              athletes. This is an estimate and may not reflect the final points awarded by Cycling BC.
            </>
          )}
        </UpgradePointExplanation>
      </Alert>
    </div>
  )
}