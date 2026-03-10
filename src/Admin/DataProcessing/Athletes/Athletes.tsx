import { Alert, Button, Card, Grid, Group, Radio, Select, Stack, Text, Textarea } from '@mantine/core'
import { useForm } from '@mantine/form'
import sortBy from 'lodash/sortBy'
import { IconCircleCheckFilled, IconExclamationCircleFilled, IconPlayerPlay } from '@tabler/icons-react'
import { useEffect, useMemo, useState } from 'react'
import { fetchEvents } from '../../../utils/aws-s3'
import { showErrorMessage } from '../../../utils/showErrorMessage'
import type { RaceEvent } from '../../../types/results'
import { adminApi } from '../../utils/api'

const YEAR_OPTIONS = Array.from({ length: 3 }, (_, i) => {
  const year = new Date().getFullYear() - i
  return { value: year.toString(), label: year.toString() }
})

type FormValues = {
  year: string
  runType: 'all-events' | 'event' | 'athletes'
  eventHash?: string | null
  uciIds: string
}

type ExecutionResult = {
  status: 'success' | 'error'
  errorMessage?: string
  durationMs?: number
  updatedAthletesCount?: number
}

export const AthletesProcessor: React.FC = () => {
  const [events, setEvents] = useState<RaceEvent[]>([])
  const [running, setRunning] = useState<boolean>(false)
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null)

  const form = useForm<FormValues>({
    initialValues: {
      uciIds: '',
      year: new Date().getFullYear().toString(),
      runType: 'all-events',
    },
    validate: {
      eventHash: (value, values) => {
        if (values.runType === 'event' && !value) {
          return 'Please select an event'
        }
        return null
      },
      uciIds: (value, values) => {
        if (values.runType === 'athletes') {
          const ids = value.split(',').map(id => id.trim())
          if (ids.some(id => !/^\d{11}$/.test(id))) {
            return 'Each UCI ID must be 11 digits (separate by commas)'
          }
        }
        return null
      },
    }
  })


  useEffect(() => {
    const fetchData = async () => {
      try {
        const { events } = await fetchEvents(+form.values.year)

        setEvents(events)

        form.setFieldValue('eventHash', null)
      } catch (error) {
        showErrorMessage({ title: 'Error', message: (error as any).message })
      }
    }

    fetchData()
  }, [form.values.year])

  const handleSubmit = async (values: typeof form.values) => {
    try {
      form.validate()

      if (!form.isValid()) return

      setExecutionResult(null)
      setRunning(true)


      let apiResponse

      if (values.runType === 'all-events') {
        apiResponse = await adminApi.run.athleteProcessor({ runType: values.runType, year: +values.year })
      } else if (values.runType === 'event') {
        apiResponse = await adminApi.run.athleteProcessor({
          runType: values.runType,
          year: +values.year,
          eventHash: values.eventHash!
        })
      } else if (values.runType === 'athletes') {
        const uciIds = values.uciIds.split(',').map(id => id.trim())
        apiResponse = await adminApi.run.athleteProcessor({
          runType: values.runType,
          year: +values.year,
          athleteUciIds: uciIds
        })
      }

      setExecutionResult({
        status: 'success',
        durationMs: apiResponse?.durationMs,
        updatedAthletesCount: apiResponse?.allUpdatedAthleteIds.length,
      })
    } catch (error) {
      setExecutionResult({
        status: 'error',
        errorMessage: (error as any).message,
      })
    } finally {
      setRunning(false)
    }
  }

  const eventOptions = useMemo(() => sortBy(events.map(event => ({
    value: event.hash,
    label: `${event.date} - ${event.name} (${event.hash})`
  })), 'label'), [events])

  return (
    <Card withBorder shadow="sm" radius="md">
      <Grid>
        <Grid.Col span={12}>
          <form onSubmit={form.onSubmit(handleSubmit)}>

            <Card.Section withBorder inheritPadding py="xs">
              <Group justify="space-between">
                <Text fw={500}>Athletes</Text>

                <Button
                  color="blue"
                  size="xs"
                  leftSection={<IconPlayerPlay/>}
                  type="submit"
                  disabled={!form.values.year}
                  loading={running}
                >
                  Run Processor
                </Button>
              </Group>
            </Card.Section>

            <Card.Section withBorder inheritPadding py="md">
              <Grid pb="xs">
                <Grid.Col span={6}>
                  <Select
                    label="Year"
                    placeholder="Select year"
                    data={YEAR_OPTIONS}
                    checkIconPosition="right"
                    required
                    {...form.getInputProps('year')}
                  />
                </Grid.Col>

                <Grid.Col span={6}>
                  <Radio.Group
                    name="runType"
                    label="Filters"
                    {...form.getInputProps('runType')}
                  >
                    <Stack gap="md" pt="xs">
                      <Radio value="all-events" label="All Events"/>
                      <Radio value="event" label="Specific Event"/>
                      {form.values.runType === 'event' && (
                        <Select
                          placeholder="Select event"
                          data={eventOptions}
                          checkIconPosition="right"
                          disabled={!events.length}
                          searchable
                          {...form.getInputProps('eventHash')}
                        />
                      )}
                      <Radio value="athletes" label="Athletes UCI IDs"/>
                      {form.values.runType === 'athletes' && (
                        <Textarea
                          placeholder="Enter athletes UCI IDs (11 digits)"
                          {...form.getInputProps('uciIds')}
                        />
                      )}
                    </Stack>
                  </Radio.Group>
                </Grid.Col>
              </Grid>
            </Card.Section>

            <Card.Section>
              {!!executionResult && executionResult.status === 'success' && (
                <Alert variant="light" color="green" title="Execution completed" icon={<IconCircleCheckFilled/>}>
                  <Group>
                    <span><strong>Duration:</strong> {Math.ceil(executionResult.durationMs! / 1000)} seconds</span>
                    <span><strong>Updated Athletes:</strong> {executionResult.updatedAthletesCount}</span>
                  </Group>
                </Alert>
              )}

              {!!executionResult && executionResult.status === 'error' && (
                <Alert variant="light" color="red" title="Execution error" icon={<IconExclamationCircleFilled/>}>
                  {executionResult.errorMessage}
                </Alert>
              )}
            </Card.Section>
          </form>
        </Grid.Col>

        {/*<Grid.Col span={6}>*/}
        {/*  <Card.Section inheritPadding px="md" py="xs" style={{ borderLeft: '1px solid var(--mantine-color-gray-3)' }}>*/}
        {/*    <Timeline lineWidth={2}>*/}
        {/*      <Timeline.Item title="Hourly">*/}
        {/*        <Text c="dimmed" size="sm">You&apos;ve created new branch <Text variant="link" component="span"*/}
        {/*                                                                        inherit>fix-notifications</Text> from*/}
        {/*          master</Text>*/}
        {/*        <Text size="xs" mt={4}>2 hours ago</Text>*/}
        {/*      </Timeline.Item>*/}

        {/*      <Timeline.Item title="Daily">*/}
        {/*        <Text c="dimmed" size="sm">You&apos;ve pushed 23 commits to<Text variant="link" component="span"*/}
        {/*                                                                         inherit>fix-notifications branch</Text></Text>*/}
        {/*        <Text size="xs" mt={4}>52 minutes ago</Text>*/}
        {/*      </Timeline.Item>*/}

        {/*      <Timeline.Item title="Manual">*/}
        {/*        <Text c="dimmed" size="sm">You&apos;ve submitted a pull request<Text variant="link" component="span"*/}
        {/*                                                                             inherit>Fix incorrect notification*/}
        {/*          message (#187)</Text></Text>*/}
        {/*        <Text size="xs" mt={4}>34 minutes ago</Text>*/}
        {/*      </Timeline.Item>*/}
        {/*    </Timeline>*/}
        {/*  </Card.Section>*/}
        {/*</Grid.Col>*/}
      </Grid>
    </Card>
  )
}