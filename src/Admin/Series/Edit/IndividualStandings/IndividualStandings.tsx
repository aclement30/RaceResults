import { Anchor, Breadcrumbs, Button, Group } from '@mantine/core'
import { IconPlus } from '@tabler/icons-react'
import { useNavigate, useOutletContext } from 'react-router'
import type { AdminSerieEditOutletContext } from '../Edit'
import { SerieEventList } from '../EventList/EventList'
import { TabBar } from '../TabBar/TabBar'
import { openAddSerieEventModal } from './AddSerieEventModal'

export const SerieIndividualStandings = () => {
  const navigate = useNavigate()
  const { serie, serieEvents, raceEvents } = useOutletContext<AdminSerieEditOutletContext>()

  if (!serie) return null

  const handleAddStandings = () => {
    openAddSerieEventModal({
      serie,
      raceEvents,
      serieEvents,
      onCreate: (date) => navigate(`/admin/series/${serie.year}/${serie.hash}/standings/individual/${date}`),
    })
  }

  return (
    <>
      <Breadcrumbs mb="md">
        <Anchor size="sm" onClick={() => navigate(`/admin/series?year=${serie.year}`)}>Series</Anchor>
        {serie && (
          <Anchor size="sm" onClick={() => navigate(`/admin/series/${serie.year}/${serie.hash}`)}>
            {serie.name}
          </Anchor>
        )}
      </Breadcrumbs>

      <Group justify="space-between" style={{ alignItems: 'center' }} pb="md">
        <div>
          <Group gap={5} style={{ alignItems: 'center' }}>
            <div>
              <h2 style={{ marginTop: 0, marginBottom: 0 }}>{serie.name}</h2>
            </div>
          </Group>
        </div>
      </Group>

      <TabBar year={serie.year} serieHash={serie.hash || ''} serie={serie}/>

      {!!serieEvents.length && (
        <Group justify="flex-start" mb="md">
          <Button leftSection={<IconPlus/>} size="sm" onClick={handleAddStandings}>
            Add Race Standings
          </Button>
        </Group>
      )}

      <SerieEventList
        serie={serie}
        serieEvents={serieEvents}
        type="individual"
        raceEvents={raceEvents}
        onAdd={handleAddStandings}/>
    </>
  )
}