import { Box, Grid, Group, Stack, Text, Textarea } from '@mantine/core'
import React, { useContext } from 'react'
import type { Serie, SerieIndividualEventCategory } from '../../../../../../shared/types'
import { HistoryAdminUserText } from '../../../../Shared/HistoryAdminUserText'
import { RequireAdmin } from '../../../../Shared/RequireAdmin/RequireAdmin'
import { UserLockSwitch } from '../../../../Shared/UserLockSwitch/UserLockSwitch'
import { useFormChanges } from '../../../../utils/useFormChanges'
import { SerieEventFormContext } from '../SerieEventFormContext'

type Props = {
  eventCategory?: SerieIndividualEventCategory
  source: Serie['source']
  onLockChange: (locked: boolean) => Promise<boolean>
}

export const CategoryDetailPanel: React.FC<Props> = ({ eventCategory, source, onLockChange }) => {
  const formRef = useContext(SerieEventFormContext)!

  const { getFieldStyles, onFormValuesChange } = useFormChanges({
    corrections: eventCategory?.corrections ?? '',
  })

  const notifyChange = () => {
    onFormValuesChange({ corrections: formRef.current.getValues().corrections ?? '' })
  }

  return (
    <Stack gap="sm">
      <Grid>
        <Grid.Col span={6}>
          <Textarea
            label="Corrections"
            autosize
            minRows={2}
            {...formRef.current.getInputProps('corrections')}
            styles={getFieldStyles('corrections')}
            onChange={e => {
              formRef.current.setFieldValue('corrections', e.target.value)
              notifyChange()
            }}
          />
        </Grid.Col>

        {!!eventCategory && (
          <Grid.Col span={6}>
            <RequireAdmin>
              <Stack gap="lg" ml="xl" mt="3">
                <Grid>
                  {!!eventCategory.createdAt && (
                    <Grid.Col span={6}>
                      <Box>
                        <Text size="sm" fw={500} mb={4}>Created</Text>
                        <Text size="sm" c="dimmed">
                          {eventCategory.createdAt ? new Date(eventCategory.createdAt).toLocaleString() : 'N/A'}
                        </Text>
                        <Text size="xs" c="dimmed">
                          by <HistoryAdminUserText userId={eventCategory.createdBy}/>
                        </Text>
                      </Box>
                    </Grid.Col>
                  )}

                  {!!eventCategory.updatedAt && (
                    <Grid.Col span={6}>
                      <Box>
                        <Text size="sm" fw={500} mb={4}>Last Updated</Text>
                        <Text size="sm" c="dimmed">
                          {new Date(eventCategory.updatedAt).toLocaleString()}
                        </Text>
                        <Text size="xs" c="dimmed">
                          by <HistoryAdminUserText userId={eventCategory.updatedBy}/>
                        </Text>
                      </Box>
                    </Grid.Col>
                  )}
                </Grid>

                {source === 'ingest' && (
                  <Box>
                    <Text size="sm" fw={500} mb={4}>Overwrite Protection</Text>
                    <Group gap="xs" wrap="nowrap" align="flex-start">
                      <UserLockSwitch
                        initialValue={eventCategory.userLocked}
                        onChange={onLockChange}
                      />
                      <Text size="xs" c="dimmed" pt="3">
                        {eventCategory.userLocked
                          ? 'Standings from this category cannot be overwritten by automatic import.'
                          : 'This category is unlocked. Future automatic standing imports might overwrite manual changes.'}
                      </Text>
                    </Group>
                  </Box>
                )}
              </Stack>
            </RequireAdmin>
          </Grid.Col>
        )}
      </Grid>
    </Stack>
  )
}
