import { Box, Grid, Group, NumberInput, Stack, Text, Textarea, TextInput } from '@mantine/core'
import React, { useContext } from 'react'
import type { CreateEventCategory, EventCategory, RaceEvent } from '../../../../../../shared/types'
import { showErrorMessage } from '../../../../../utils/showErrorMessage'
import { HistoryAdminUserText } from '../../../../Shared/HistoryAdminUserText'
import { RequireAdmin } from '../../../../Shared/RequireAdmin/RequireAdmin'
import { UserLockSwitch } from '../../../../Shared/UserLockSwitch/UserLockSwitch'
import { adminApi } from '../../../../utils/api'
import { useFormChanges } from '../../../../utils/useFormChanges'
import { ResultsFormContext } from '../ResultsFormContext'
import { formatTime, parseTime } from '../utils'

type Props = {
  category: CreateEventCategory
  year: number
  eventHash: string
  event: RaceEvent
  onCategoryChange: (updates: Partial<CreateEventCategory>) => void
}

export const CategoryDetailPanel: React.FC<Props> = ({ category, year, eventHash, event, onCategoryChange }) => {
  const formRef = useContext(ResultsFormContext)!

  const initialValues = {
    startTime: category.startTime ?? null,
    starters: category.starters ?? 0,
    finishers: category.finishers ?? 0,
    laps: category.laps ?? null,
    lapDistanceKm: category.lapDistanceKm ?? null,
    raceDistanceKm: category.raceDistanceKm ?? null,
    corrections: category.corrections ?? '',
  }

  const { getFieldStyles, onFormValuesChange } = useFormChanges(initialValues)

  const notifyChange = () => {
    const v = formRef.current.getValues()
    onFormValuesChange({
      startTime: v.startTime,
      starters: v.starters,
      finishers: v.finishers,
      laps: v.laps,
      lapDistanceKm: v.lapDistanceKm,
      raceDistanceKm: v.raceDistanceKm,
      corrections: v.corrections,
    })
  }

  const recalcRaceDistance = (laps: number | null, lapDistanceKm: number | null) => {
    if (laps != null && laps > 0 && lapDistanceKm != null && lapDistanceKm > 0) {
      const raceDistanceKm = Math.round(laps * lapDistanceKm * 100) / 100
      formRef.current.setFieldValue('raceDistanceKm', raceDistanceKm)
    }
  }

  const handleLapsChange = (val: string | number) => {
    const laps = typeof val === 'number' ? val : null
    formRef.current.setFieldValue('laps', laps)
    recalcRaceDistance(laps, formRef.current.getValues().lapDistanceKm)
    notifyChange()
  }

  const handleLapDistanceChange = (val: string | number) => {
    const lapDistanceKm = typeof val === 'number' ? val : null
    formRef.current.setFieldValue('lapDistanceKm', lapDistanceKm)
    recalcRaceDistance(formRef.current.getValues().laps, lapDistanceKm)
    notifyChange()
  }

  const handleLockChange = async (locked: boolean): Promise<boolean> => {
    return new Promise(async (resolve) => {
      try {
        await adminApi.update.eventResultCategoryLock(category.alias, locked, { year, eventHash })
        resolve(true)
        onCategoryChange({ userLocked: locked })
      } catch (error) {
        showErrorMessage({ title: 'Error', message: (error as any).message })
        resolve(false)
      }
    })
  }

  return (
    <Stack gap="sm">
      <Grid>
        <Grid.Col span={7}>
          <Grid mb="md">
            <Grid.Col span={2}>
              <TextInput
                label="Start Time"
                placeholder="h:mm:ss"
                key={`startTime-${category.alias}`}
                defaultValue={formRef.current.getValues().startTime ? formatTime(formRef.current.getValues().startTime!) : ''}
                styles={getFieldStyles('startTime')}
                onBlur={e => {
                  formRef.current.setFieldValue('startTime', parseTime(e.target.value) || null)
                  notifyChange()
                }}
              />
            </Grid.Col>

            <Grid.Col span={2}>
              <NumberInput
                label="Starters"
                hideControls
                min={0}
                key={`starters-${category.alias}`}
                {...formRef.current.getInputProps('starters')}
                styles={getFieldStyles('starters')}
                onChange={val => {
                  formRef.current.setFieldValue('starters', typeof val === 'number' ? val : 0)
                  notifyChange()
                }}
              />
            </Grid.Col>

            <Grid.Col span={2}>
              <NumberInput
                label="Finishers"
                hideControls
                min={0}
                key={`finishers-${category.alias}`}
                {...formRef.current.getInputProps('finishers')}
                styles={getFieldStyles('finishers')}
                onChange={val => {
                  formRef.current.setFieldValue('finishers', typeof val === 'number' ? val : 0)
                  notifyChange()
                }}
              />
            </Grid.Col>

            <Grid.Col span={2}>
              <NumberInput
                label="Laps"
                hideControls
                min={0}
                key={`laps-${category.alias}`}
                {...formRef.current.getInputProps('laps')}
                styles={getFieldStyles('laps')}
                onChange={handleLapsChange}
              />
            </Grid.Col>

            <Grid.Col span={2}>
              <NumberInput
                label="Lap Distance"
                hideControls
                decimalScale={2}
                min={0}
                key={`lapDistanceKm-${category.alias}`}
                {...formRef.current.getInputProps('lapDistanceKm')}
                styles={getFieldStyles('lapDistanceKm')}
                onChange={handleLapDistanceChange}
                rightSection={<Text size="xs" pr="xs">km</Text>}
              />
            </Grid.Col>

            <Grid.Col span={2}>
              <NumberInput
                label="Race Distance"
                hideControls
                decimalScale={2}
                min={0}
                key={`raceDistanceKm-${category.alias}`}
                {...formRef.current.getInputProps('raceDistanceKm')}
                styles={getFieldStyles('raceDistanceKm')}
                onChange={val => {
                  formRef.current.setFieldValue('raceDistanceKm', typeof val === 'number' ? val : null)
                  notifyChange()
                }}
                rightSection={<Text size="xs" pr="xs">km</Text>}
              />
            </Grid.Col>
          </Grid>

          <Textarea
            label="Corrections"
            autosize
            minRows={2}
            key={`corrections-${category.alias}`}
            {...formRef.current.getInputProps('corrections')}
            styles={getFieldStyles('corrections')}
            onChange={e => {
              formRef.current.setFieldValue('corrections', e.target.value)
              notifyChange()
            }}
          />
        </Grid.Col>

        <Grid.Col span={5}>
          <RequireAdmin>
            {(category as EventCategory) && (
              <Stack gap="lg" ml="xl">
                <Grid>
                  <Grid.Col span={5}>
                    <Box>
                      <Text size="sm" fw={500} mb={4}>Created</Text>
                      <Text size="sm" c="dimmed">
                        {category.createdAt ? new Date(category.createdAt).toLocaleString() : 'N/A'}
                      </Text>
                      <Text size="xs" c="dimmed">
                        by <HistoryAdminUserText userId={(category as EventCategory).createdBy}/>
                      </Text>
                    </Box>
                  </Grid.Col>

                  {!!category.updatedAt && (
                    <Grid.Col span={5}>
                      <Box>
                        <Text size="sm" fw={500} mb={4}>Last Updated</Text>
                        <Text size="sm" c="dimmed">
                          {category.updatedAt ? new Date(category.updatedAt).toLocaleString() : 'N/A'}
                        </Text>
                        <Text size="xs" c="dimmed">
                          by <HistoryAdminUserText userId={(category as EventCategory).updatedBy}/>
                        </Text>
                      </Box>
                    </Grid.Col>
                  )}
                </Grid>

                {event.source === 'ingest' && (
                  <Box>
                    <Text size="sm" fw={500} mb={4}>Overwrite Protection</Text>
                    <Group gap="xs" wrap="nowrap" align="flex-start">
                      <UserLockSwitch
                        initialValue={(category as EventCategory).userLocked}
                        onChange={handleLockChange}
                      />
                      <Text size="xs" c="dimmed" pt="3">
                        {(category as EventCategory).userLocked ? 'Results from this category cannot be overwritten by automatic results import.' : 'This category is unlocked. Future automatic results imports might overwrite manual changes.'}
                      </Text>
                    </Group>
                  </Box>
                )}
              </Stack>
            )}
          </RequireAdmin>
        </Grid.Col>
      </Grid>
    </Stack>
  )
}
