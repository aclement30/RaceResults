import { Button, Divider, Group, LoadingOverlay, Tabs } from '@mantine/core'
import { IconCalendarOff, IconCircleCheck, IconEyeOff } from '@tabler/icons-react'
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import type { EventResults, RaceEvent, Serie } from '../../../../shared/types'
import { Loader } from '../../../Loader/Loader'
import { showErrorMessage } from '../../../utils/showErrorMessage'
import { showMessage, showSuccessMessage } from '../../../utils/showSuccessMessage'
import { EntityNotFound } from '../../Shared/EntityNotFound'
import { PublishedBadge } from '../../Shared/PublishedBadge/PublishedBadge'
import { adminApi } from '../../utils/api'
import { EventInfoForm } from './EventInfoForm/EventInfoForm'
import { EventResults as EventResultsComponent } from './EventResults/EventResults'

type AdminEventEditProps = {
  eventHash: string
  year: number
  event?: RaceEvent
  events: RaceEvent[]
  series: Serie[]
  tab?: string
  loading: boolean
  onChange: (event: RaceEvent) => void
}

const CURRENT_YEAR = new Date().getFullYear()

export const AdminEventEdit: React.FC<AdminEventEditProps> = ({
  eventHash,
  year,
  event,
  events,
  series,
  tab = 'event-info',
  loading,
  onChange
}) => {
  const navigate = useNavigate()
  const [loadingResults, setLoadingResults] = useState(false)
  const [eventResults, setEventResults] = useState<EventResults>()

  const fetchData = async () => {
    if (!eventHash || !year) return

    try {
      setLoadingResults(true)

      const [eventResults] = await Promise.all([
        adminApi.get.eventResults(year, eventHash),
      ])

      setEventResults(eventResults)
    } catch (error) {
      showErrorMessage({ title: 'Error', message: (error as any).message })
    } finally {
      setLoadingResults(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [eventHash, year])

  const handlePublishedChange = async (published: boolean) => {
    if (!event) return

    const year = +event.date.slice(0, 4)

    try {
      await adminApi.update.eventPublished(event.hash, year, published)
      onChange({ ...event, published })

      if (published) {
        showSuccessMessage({
          title: 'Event published',
          message: `${event.name} has been published.`
        })
      } else {
        showMessage({
          title: 'Event unpublished',
          message: `${event.name} has been unpublished.`,
          icon: <IconEyeOff/>,
          color: 'yellow'
        })
      }
    } catch (error) {
      showErrorMessage({ title: 'Error', message: (error as any).message })
    }
  }

  const handleEventChange = () => {
    fetchData()
  }

  const handleBack = () => {
    navigate(`/admin/events`)
  }

  const handleSelectTab = (tab: string) => {
    const eventYear = event?.date.slice(0, 4) || CURRENT_YEAR

    navigate(`/admin/events/${eventYear}/${eventHash}/edit/${tab}`)
  }

  if (eventHash && !event && !loading) {
    return (
      <EntityNotFound
        icon={IconCalendarOff}
        title="Event Not Found"
        description="The event you're looking for doesn't exist or may have been removed."
        buttonText="Back to Events"
        onButtonClick={() => navigate('/admin/events')}
      />
    )
  }

  return (
    <>
      <Group justify="space-between" style={{ alignItems: 'flex-start' }} pb="md">
        <div>
          <Group gap={5} style={{ alignItems: 'center' }}>
            <h2 style={{ marginTop: 0, marginBottom: 0 }}>{event ? `Edit Event: ${event?.name}` : 'Add New Event'}</h2>
          </Group>
        </div>

        {eventHash && event && (
          <Group gap="md" align="center">
            <PublishedBadge published={event.published}/>

            <Button
              variant={event.published ? 'outline' : 'primary'}
              onClick={() => handlePublishedChange(!event.published)}
              leftSection={event.published ? <IconEyeOff/> : <IconCircleCheck/>}
            >
              {event.published ? 'Unpublish' : 'Publish'}
            </Button>
          </Group>
        )}
      </Group>

      <Divider mb="md"/>

      <LoadingOverlay
        visible={loading || loadingResults} overlayProps={{ radius: 'sm', blur: 2 }}
        loaderProps={{
          children: <Loader text="Loading data..."/>,
        }}
      />

      <Tabs value={tab} keepMounted={false}>
        <Tabs.List>
          <Tabs.Tab
            value="event-info"
            onClick={() => eventHash && handleSelectTab('event-info')}>
            Event Information
          </Tabs.Tab>
          <Tabs.Tab
            value="results"
            disabled={!eventHash}
            onClick={() => handleSelectTab('results')}>
            Results
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="event-info" pt="md">
          <EventInfoForm
            eventHash={eventHash}
            event={event}
            events={events}
            series={series}
            onChange={onChange}
            onTabChange={handleSelectTab}
            onCancel={handleBack}
          />
        </Tabs.Panel>

        <Tabs.Panel value="results" pt="md">
          {event && eventResults && (
            <EventResultsComponent
              results={eventResults}
              year={year}
              eventHash={eventHash}
              event={event}
              onEventChange={handleEventChange}
            />
          )}
        </Tabs.Panel>
      </Tabs>
    </>
  )
}