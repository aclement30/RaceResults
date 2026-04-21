import { Button, Divider, Group, LoadingOverlay, Stack, Text } from '@mantine/core'
import { IconPencil, IconPlus, IconUsersGroup } from '@tabler/icons-react'
import * as React from 'react'
import { useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router'
import type { BaseSerieEvent, RaceEvent, Serie } from '../../../../shared/types'
import { Loader } from '../../../Loader/Loader'
import { EmptyState } from '../../../Shared/EmptyState'
import { showErrorMessage } from '../../../utils/showErrorMessage'
import { AdminContext } from '../../Shared/AdminContext'
import { adminApi } from '../../utils/api'
import { useProfile } from '../../utils/useProfile'
import { SerieEventList } from '../Edit/EventList/EventList'
import { openAddSerieEventModal } from '../Edit/IndividualStandings/AddSerieEventModal'
import type { AdminSerieOutletContext } from '../Series'

type AdminSerieListProps = {
  series: Serie[]
  events: RaceEvent[]
  year: number
}

export const AdminSerieListOutlet: React.FC = () => {
  const { events, series, year } = useOutletContext<AdminSerieOutletContext>()
  return <AdminSerieList series={series} events={events} year={year}/>
}

export const AdminSerieList: React.FC<AdminSerieListProps> = ({ series, events, year }) => {
  const navigate = useNavigate()
  const { organizerAlias, isAdmin } = useProfile()
  const { organizers } = useContext(AdminContext)
  const [seriesEvents, setSeriesEvents] = useState<Record<string, BaseSerieEvent[]>>({})
  const [eventLoading, setEventLoading] = useState(false)

  const sortedSeries = useMemo(() => {
    return [...series].sort((a, b) => a.name.localeCompare(b.name))
  }, [series])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setEventLoading(true)

        const allSeriesEvents = await Promise.all(series.map(async (serie) => adminApi.get.serieEvents(year, serie.hash, 'individual')))

        const seriesEvents: Record<string, BaseSerieEvent[]> = {}
        series.forEach((serie, index) => {
          seriesEvents[serie.hash] = allSeriesEvents[index]
        })

        setSeriesEvents(seriesEvents)
      } catch (err) {
        showErrorMessage({ title: 'Error', message: (err as Error).message })

        setSeriesEvents({})
      } finally {
        setEventLoading(false)
      }
    }
    fetchData()
  }, [series])

  const handleAddStandings = (serie: Serie) => {
    openAddSerieEventModal({
      serie,
      raceEvents: events,
      serieEvents: seriesEvents[serie.hash] ?? [],
      onCreate: (date) => navigate(`/admin/series/${serie.year}/${serie.hash}/standings/individual/${date}`),
    })
  }

  return (
    <>
      <Group justify="space-between" style={{ alignItems: 'flex-start' }}>
        <div>
          <Group gap={5} style={{ alignItems: 'center' }}>
            <h2 style={{ marginTop: 0, marginBottom: 0 }}>
              {year} Series{(!isAdmin && organizerAlias) ? ` - ${organizers.get(organizerAlias)?.displayName}` : ''}
            </h2>
          </Group>
        </div>

        <Button leftSection={<IconPlus/>} onClick={() => navigate('/admin/series/new')}>Create Serie</Button>
      </Group>

      <Divider my="md"/>

      <LoadingOverlay
        visible={eventLoading} overlayProps={{ radius: 'sm', blur: 2 }}
        loaderProps={{ children: <Loader text="Loading data..."/> }}
      />

      <div style={{ width: '100%' }}>
        {sortedSeries.length ? (
          <Stack gap="xl">
            {sortedSeries.map(serie => {
              return (
                <div key={serie.hash}>
                  <Group mb="sm" justify="space-between">
                    <Group gap="sm" align="center">
                      <Text fw={600} size="lg">{serie.name}</Text>
                      <Text c="dimmed"
                            size="sm">{organizers.get(serie.organizerAlias)?.displayName || serie.organizerAlias}</Text>
                      {/*<Group gap="xs">*/}
                      {/*  {serie.types.includes('individual') && <Badge size="sm" variant="filled">Individual</Badge>}*/}
                      {/*  {serie.types.includes('team') && <Badge size="sm" variant="filled">Team</Badge>}*/}
                      {/*</Group>*/}
                    </Group>

                    <Group>
                      {serie.types.includes('team') && (
                        <Button
                          size="xs"
                          leftSection={<IconUsersGroup size="16"/>}
                          onClick={() => navigate(`/admin/series/${serie.year}/${serie.hash}/standings/team`)}>
                          Update Team Standings
                        </Button>
                      )}

                      <Button
                        size="xs"
                        variant="outline"
                        leftSection={<IconPencil size="16"/>}
                        onClick={() => navigate(`/admin/series/${serie.year}/${serie.hash}`)}>
                        Edit Serie
                      </Button>
                    </Group>
                  </Group>

                  <SerieEventList
                    serie={serie}
                    serieEvents={seriesEvents[serie.hash]}
                    type="individual"
                    raceEvents={events}
                    onAdd={() => handleAddStandings(serie)}
                  />
                </div>
              )
            })}
          </Stack>
        ) : (
          <EmptyState text="No series matching the selected filters"/>
        )}
      </div>
    </>
  )
}
