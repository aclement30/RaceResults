import {
  Autocomplete,
  Badge,
  Box,
  Button,
  Fieldset,
  Grid,
  Group,
  Select,
  Stack,
  Text,
  Textarea,
  TextInput,
  Tooltip,
} from '@mantine/core'
import { DatePickerInput } from '@mantine/dates'
import { useForm } from '@mantine/form'
import { IconTrash } from '@tabler/icons-react'
import React, { useContext, useEffect, useMemo, useState } from 'react'
import type {
  CreateEvent,
  RaceEvent,
  RaceType,
  SanctionedEventType,
  Serie,
  TDiscipline,
  UpdateEvent
} from '../../../../../shared/types'
import { BC_SANCTIONED_EVENT_TYPES, RACE_TYPES } from '../../../../config/event-types'
import { CANADIAN_PROVINCES, CONTINENTAL_US_STATES } from '../../../../config/locations'
import { showErrorMessage } from '../../../../utils/showErrorMessage'
import { showSuccessMessage } from '../../../../utils/showSuccessMessage'
import { AdminContext } from '../../../Shared/AdminContext'
import { HistoryAdminUserText } from '../../../Shared/HistoryAdminUserText'
import { PublishedBadge } from '../../../Shared/PublishedBadge/PublishedBadge'
import { RequireAdmin } from '../../../Shared/RequireAdmin/RequireAdmin'
import { UserLockSwitch } from '../../../Shared/UserLockSwitch/UserLockSwitch'
import { adminApi } from '../../../utils/api'
import { getSerieAliasFromName, getSerieNameFromAlias } from '../../../utils/getSerieAliasFromName'
import { useFormChanges } from '../../../utils/useFormChanges'
import { useProfile } from '../../../utils/useProfile'
import { openDeleteEventModal } from '../DeleteEventModal/DeleteEventModal'

type EventInfoFormProps = {
  eventHash?: string
  event?: RaceEvent
  events: RaceEvent[]
  series: Serie[]
  onChange: (event: RaceEvent) => void
  onTabChange: (tab: string) => void
  onCancel: () => void
}

type FormValues = {
  name: string
  date: string
  discipline: TDiscipline | null
  serie: string
  location: {
    city: string
    province: string | null
    country: 'CA' | 'US'
  }
  organizerAlias: string | null
  sanctionedEventType: SanctionedEventType | null
  raceType: RaceType | null
  sourceUrls: string
  raceNotes: string
}

const DISCIPLINE_OPTIONS = [
  { value: 'ROAD', label: 'Road' },
  { value: 'CX', label: 'Cyclocross' },
]

const SANCTIONED_EVENT_OPTIONS = Object.entries(BC_SANCTIONED_EVENT_TYPES).map(([key, value]) => ({
  value: key,
  label: value
}))

const RACE_TYPE_OPTIONS = Object.entries(RACE_TYPES).map(([key, value]) => ({
  value: key,
  label: value
}))

export const EventInfoForm: React.FC<EventInfoFormProps> = ({
  eventHash,
  event,
  events,
  series,
  onChange,
  onTabChange,
  onCancel,
}) => {
  const [saving, setSaving] = useState<boolean>(false)
  const { organizers } = useContext(AdminContext)
  const { organizerAlias: userOrganizerAlias, isAdmin } = useProfile()

  const initialValues: FormValues = useMemo(() => ({
    name: event?.name || '',
    date: event?.date ? event.date : new Date().toLocaleDateString(),
    discipline: event?.discipline || 'ROAD' as TDiscipline,
    serie: event?.serie && getSerieNameFromAlias(event.serie) || '',
    location: event?.location || { city: '', province: 'BC', country: 'CA' },
    organizerAlias: event?.organizerAlias || (!isAdmin && userOrganizerAlias) || null,
    sanctionedEventType: (event?.sanctionedEventType) as SanctionedEventType | null,
    raceType: event?.raceType || null,
    sourceUrls: event?.sourceUrls ? event.sourceUrls.join('\n') : '',
    raceNotes: event?.raceNotes ?? '',
  }), [event])

  const { getFieldStyles, hasFormChanges, onFormValuesChange, resetInitialValues } = useFormChanges(initialValues)

  // Reset form values whenever event changes
  useEffect(() => {
    form.setValues(initialValues)
    resetInitialValues(initialValues)
  }, [initialValues])

  const form = useForm<FormValues>({
    onValuesChange: onFormValuesChange,
    validate: {
      date: (value) => {
        if (!value) {
          return 'Date is required'
        }
        const selectedDate = new Date(value)
        const today = new Date()
        if (selectedDate > today) {
          return 'Date cannot be in the future'
        }
        return null
      },
      name: (value) => {
        if (!value) {
          return 'Event name is required'
        }
        return null
      },
      // Organizer is required and must be valid
      organizerAlias: (value) => {
        if (!value) {
          return 'Organizer is required'
        }
        if (!organizers.has(value)) {
          return 'Invalid organizer'
        }
        return null
      },
      // Province is required and must be valid based on country
      location: {
        city: (value) => {
          if (!value) {
            return 'City is required'
          }
          return null
        },
        province: (value, values) => {
          if (!value) {
            return 'Province is required'
          }
          const validProvinces = values.location.country === 'CA' ? CANADIAN_PROVINCES.map(p => p.code) : CONTINENTAL_US_STATES.map(s => s.code)
          if (!validProvinces.includes(value)) {
            return 'Invalid province for selected country'
          }
          return null
        },
        country: (value) => {
          if (!value) {
            return 'Country is required'
          }
          if (!['CA', 'US'].includes(value)) {
            return 'Invalid country'
          }
          return null
        }
      },
      // Sanctioned event type cannot be AA-USA if country is CA
      sanctionedEventType: (value, values) => {
        if (!value) {
          return 'Sanctioned event type is required'
        } else if (value === 'AA-USA' && values.location.country === 'CA') {
          return 'AA-USA is only for US events'
        }
        return null
      },
      discipline: (value) => {
        if (!value) {
          return 'Discipline is required'
        }
        if (!['ROAD', 'CX'].includes(value)) {
          return 'Invalid discipline'
        }
        return null
      },
      // If discipline is ROAD, raceType is required
      raceType: (value, values) => {
        if (values.discipline === 'ROAD' && !value) {
          return 'Race type is required for road events'
        }
        return null
      },
    }
  })

  const serieOptions = useMemo(() => {
    const serieAliases = series.map(s => s.name)
    const eventSerieAliases = events.map(e => getSerieNameFromAlias(e.serie)).filter((s): s is string => !!s)
    return Array.from(new Set([...serieAliases, ...eventSerieAliases])).sort()
  }, [events, series])

  const organizerOptions = useMemo(() => {
    // Map organizers to select options with alias as value and name (alias) as label
    return Array.from(organizers)
    .map(([alias, { displayName }]) => ({
      value: alias,
      label: displayName
    }))
    .sort((a, b) => a.label.localeCompare(b.label))
  }, [organizers])

  const provinceOptions = useMemo(() => {
    const list = form.values.location?.country === 'CA' ? CANADIAN_PROVINCES : CONTINENTAL_US_STATES

    return Array.from(list).map(({ code, name }) => ({
      value: code,
      label: name
    }))
  }, [form.values.location?.country])

  // Reset province when country changes
  useEffect(() => {
    form.setFieldValue('location.province', form.values.location?.country === 'CA' ? 'BC' : null)
  }, [form.values.location?.country])

  // Reset raceType when discipline changes
  useEffect(() => {
    if (form.values.discipline !== 'ROAD') {
      form.setFieldValue('raceType', null)
    }
  }, [form.values.discipline])

  const handleSubmit = async (values: FormValues) => {
    try {
      setSaving(true)

      const sourceUrls = values.sourceUrls
      .split(/[\n,]/)
      .map(u => u.trim())
      .filter(Boolean)

      const eventData: CreateEvent = {
        ...values,
        organizerAlias: values.organizerAlias!,
        location: {
          city: values.location.city,
          province: values.location.province!,
          country: values.location.country,
        },
        date: values.date,
        discipline: values.discipline as TDiscipline,
        sanctionedEventType: values.sanctionedEventType!,
        raceType: values.raceType || null,
        sourceUrls,
        raceNotes: values.raceNotes?.length ? values.raceNotes : undefined,
        serie: values.serie?.length ? getSerieAliasFromName(values.serie) : null,
        published: event?.published || false,
      }

      let updatedEvent

      if (!eventHash) {
        // Create new event
        updatedEvent = await adminApi.create.event(eventData)
      } else {
        // Update existing event
        updatedEvent = await adminApi.update.event(eventHash, eventData as UpdateEvent)
      }

      showSuccessMessage({ message: 'Event updated successfully' })
      onChange(updatedEvent)

      if (!eventHash) {
        onTabChange('results')
      } else {
        onCancel()
      }
    } catch (error) {
      showErrorMessage({ title: 'Error', message: (error as any).message })
    } finally {
      setSaving(false)
    }
  }

  const handleLockChange = async (locked: boolean): Promise<boolean> => {
    if (!event) return false

    return new Promise(async (resolve) => {
      try {
        await adminApi.update.eventLock(event.hash, +event.date.slice(0, 4), locked)

        onChange({ ...event, userLocked: locked })

        resolve(true)
      } catch (error) {
        showErrorMessage({ title: 'Error', message: (error as any).message })
        resolve(false)
      }
    })
  }

  const submitLabel = useMemo(() => {
    let label

    if (!eventHash) {
      label = 'Create Draft Event'
    } else {
      label = 'Save Draft'

      if (event?.published) {
        label = 'Save Changes'
      }
    }

    return label
  }, [eventHash, event?.published])

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>

      <Stack gap="md">
        <Fieldset legend="Basic Information">
          <Stack gap="sm">
            <Grid>
              <Grid.Col span={4}>
                <DatePickerInput
                  label="Date"
                  required
                  {...form.getInputProps('date')}
                  styles={getFieldStyles('date')}
                  maxDate={new Date()}
                />
              </Grid.Col>

              <Grid.Col span={8}>
                <TextInput
                  label="Event Name"
                  required
                  {...form.getInputProps('name')}
                  styles={getFieldStyles('name')}
                />
              </Grid.Col>
            </Grid>

            <Grid>
              <Grid.Col span={6}>
                <Select
                  label="Organizer"
                  required
                  data={organizerOptions}
                  disabled={!isAdmin}
                  searchable
                  {...form.getInputProps('organizerAlias')}
                  styles={getFieldStyles('organizerAlias')}
                />
              </Grid.Col>

              <Grid.Col span={6}>
                <Autocomplete
                  label="Series"
                  placeholder="Optional"
                  data={serieOptions}
                  clearable
                  {...form.getInputProps('serie')}
                  styles={getFieldStyles('serie')}
                />
              </Grid.Col>
            </Grid>
          </Stack>
        </Fieldset>

        <Fieldset legend="Location">
          <Stack gap="sm">
            <TextInput
              label="City"
              required
              {...form.getInputProps('location.city')}
              styles={getFieldStyles('location.city')}
            />

            <Grid>
              <Grid.Col span={6}>
                <Select
                  label="Province"
                  required
                  data={provinceOptions}
                  {...form.getInputProps('location.province')}
                  styles={getFieldStyles('location.province')}
                />
              </Grid.Col>

              <Grid.Col span={6}>
                <Select
                  label="Country"
                  required
                  data={[
                    { value: 'CA', label: 'Canada' },
                    { value: 'US', label: 'United States' },
                  ]}
                  {...form.getInputProps('location.country')}
                  styles={getFieldStyles('location.country')}
                />
              </Grid.Col>
            </Grid>
          </Stack>
        </Fieldset>

        <Fieldset legend="Event Classification">
          <Grid>
            <Grid.Col span={4}>
              <Select
                label="Sanctioned Event Type"
                data={SANCTIONED_EVENT_OPTIONS}
                required
                {...form.getInputProps('sanctionedEventType')}
                styles={getFieldStyles('sanctionedEventType')}
              />
            </Grid.Col>

            <Grid.Col span={4}>
              <Select
                label="Discipline"
                required
                data={DISCIPLINE_OPTIONS}
                {...form.getInputProps('discipline')}
                styles={getFieldStyles('discipline')}
              />
            </Grid.Col>

            <Grid.Col span={4}>
              <Select
                label="Race Type"
                data={[
                  ...RACE_TYPE_OPTIONS,
                  { value: '', label: 'Other' },
                ]}
                required={form.values.discipline === 'ROAD'}
                disabled={form.values.discipline !== 'ROAD'}
                {...form.getInputProps('raceType')}
                styles={getFieldStyles('raceType')}
              />
            </Grid.Col>
          </Grid>
        </Fieldset>

        <Fieldset legend="Additional Information">
          <Grid>
            <Grid.Col span={6}>
              <Textarea
                label="Source URLs"
                placeholder="One URL per line, or comma-separated"
                autosize
                minRows={2}
                {...form.getInputProps('sourceUrls')}
                // value={(form.values.sourceUrls ?? []).join('\n')}
                // onChange={(e) => {
                //   const urls = e.currentTarget.value
                //   .split(/[\n,]/)
                //   .map(u => u.trim())
                //   .filter(Boolean)
                //   form.setFieldValue('sourceUrls', urls)
                // }}
                styles={getFieldStyles('sourceUrls')}
              />
            </Grid.Col>

            <Grid.Col span={6}>
              <Textarea
                label="Race Notes"
                placeholder="Optional notes about the race"
                autosize
                minRows={2}
                {...form.getInputProps('raceNotes')}
                styles={getFieldStyles('raceNotes')}
              />
            </Grid.Col>
          </Grid>
        </Fieldset>

        <RequireAdmin>
          {event && eventHash && (
            <Box
              p="md"
              bg="gray.0"
              style={{ borderRadius: '8px' }}
            >
              <Grid>
                <Grid.Col span={4}>
                  <Box>
                    <Text size="sm" fw={500} mb={4}>Source</Text>
                    <Badge
                      variant="dot"
                      color={event.source === 'manual' ? 'blue' : 'gray'}
                      size="md"
                    >
                      {event.source || 'Unknown'}
                    </Badge>
                  </Box>
                </Grid.Col>

                {event.source === 'ingest' && (
                  <Grid.Col span={4}>
                    <Box>
                      <Text size="sm" fw={500} mb={4}>Provider</Text>
                      <Text size="sm" c="dimmed">
                        {event.provider || 'N/A'}
                      </Text>
                    </Box>
                  </Grid.Col>
                )}

                <Grid.Col span={4}>
                  <Box>
                    <Text size="sm" fw={500} mb={4}>Created</Text>
                    <Text size="sm" c="dimmed">
                      {event.createdAt ? new Date(event.createdAt).toLocaleString() : 'N/A'}
                    </Text>
                    <Text size="xs" c="dimmed">
                      by <HistoryAdminUserText userId={event.createdBy}/>
                    </Text>
                  </Box>
                </Grid.Col>

                <Grid.Col span={4}>
                  <Box>
                    <Text size="sm" fw={500} mb={4}>Published Status</Text>
                    <PublishedBadge published={event.published}/>
                  </Box>
                </Grid.Col>

                {event.source === 'ingest' && (
                  <Grid.Col span={4}>
                    <Box>
                      <Text size="sm" fw={500} mb={4}>Overwrite Protection</Text>
                      <Group gap="xs" wrap="nowrap" align="flex-start">
                        <UserLockSwitch
                          initialValue={event.userLocked}
                          onChange={handleLockChange}
                        />

                        <Text size="xs" c="dimmed" pt={3}>
                          {event.userLocked ? <>Event information cannot be overwritten by automatic ingest<br/>(results
                            are handled separately).</> : <>Automatic ingest may overwrite manual changes in event
                            information<br/>(results are handled separately).</>}
                        </Text>
                      </Group>
                    </Box>
                  </Grid.Col>
                )}

                <Grid.Col span={4}>
                  <Box>
                    <Text size="sm" fw={500} mb={4}>Last Updated</Text>
                    <Text size="sm" c="dimmed">
                      {event.updatedAt ? new Date(event.updatedAt).toLocaleString() : 'N/A'}
                    </Text>
                    <Text size="xs" c="dimmed">
                      by <HistoryAdminUserText userId={event.updatedBy}/>
                    </Text>
                  </Box>
                </Grid.Col>
              </Grid>
            </Box>
          )}
        </RequireAdmin>
      </Stack>

      <Group justify="space-between" align="center" mt="md">
        <div>
          <RequireAdmin>
            {event && (
              <Tooltip label="Only unpublished events can be deleted" disabled={!event.published}>
                <span>
                  <Button
                    type="button"
                    variant="outline"
                    color="red"
                    leftSection={<IconTrash size={16}/>}
                    disabled={event.published}
                    onClick={() => openDeleteEventModal({ event, onDeleted: onCancel })}
                  >
                    Delete
                  </Button>
                </span>
              </Tooltip>
            )}
          </RequireAdmin>
        </div>

        <Group>
          <Text size="sm" c="dimmed">
            {event?.updatedAt && `Last updated: ${event?.updatedAt.slice(0, 16).replace('T', ', ')}`}
          </Text>

          <Button type="button" variant="light" onClick={onCancel}>
            Cancel
          </Button>

          <Button
            type="submit"
            loading={saving}
            disabled={!hasFormChanges}
          >
            {submitLabel}
          </Button>
        </Group>
      </Group>
    </form>
  )
}