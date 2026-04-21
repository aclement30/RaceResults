import {
  Anchor,
  Box,
  Breadcrumbs,
  Button,
  Checkbox,
  Fieldset,
  Grid,
  Group,
  Select,
  Stack,
  Text,
  TextInput,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import React, { useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router'
import type { CreateSerie, UpdateSerie } from '../../../../../shared/types'
import { showErrorMessage } from '../../../../utils/showErrorMessage'
import { showSuccessMessage } from '../../../../utils/showSuccessMessage'
import { AdminContext } from '../../../Shared/AdminContext'
import { HistoryAdminUserText } from '../../../Shared/HistoryAdminUserText'
import { RequireAdmin } from '../../../Shared/RequireAdmin/RequireAdmin'
import { UserLockSwitch } from '../../../Shared/UserLockSwitch/UserLockSwitch'
import { adminApi } from '../../../utils/api'
import { getSerieAliasFromName } from '../../../utils/getSerieAliasFromName'
import { useFormChanges } from '../../../utils/useFormChanges'
import { useProfile } from '../../../utils/useProfile'
import type { AdminSerieEditOutletContext } from '../Edit'
import { TabBar } from '../TabBar/TabBar'

type FormValues = {
  name: string
  alias: string
  year: number
  organizerAlias: string | null
  types: ('individual' | 'team')[]
}

const CURRENT_YEAR = new Date().getFullYear()

export const AdminSerieInfoForm: React.FC = () => {
  const { serie, onSerieChange } = useOutletContext<AdminSerieEditOutletContext>()
  const navigate = useNavigate()
  const { organizers } = useContext(AdminContext)
  const { organizerAlias: userOrganizerAlias, isAdmin } = useProfile()

  const initialValues: FormValues = useMemo(() => ({
    name: serie?.name || '',
    alias: serie?.alias || '',
    year: serie?.year || CURRENT_YEAR,
    organizerAlias: serie?.organizerAlias || (!isAdmin && userOrganizerAlias) || null,
    types: serie?.types || ['individual'],
  }), [serie])

  const [aliasManuallyEdited, setAliasManuallyEdited] = useState(false)

  const { getFieldStyles, hasFormChanges, onFormValuesChange, resetInitialValues } = useFormChanges(initialValues)

  useEffect(() => {
    form.setValues(initialValues)
    resetInitialValues(initialValues)
    setAliasManuallyEdited(false)
  }, [initialValues])

  const form = useForm<FormValues>({
    onValuesChange: onFormValuesChange,
    validate: {
      name: (value) => value ? null : 'Name is required',
      alias: (value) => value ? null : 'Alias is required',
      year: (value) => value && value > 0 ? null : 'Year is required',
      organizerAlias: (value) => {
        if (!value) return 'Organizer is required'
        if (!organizers.has(value)) return 'Invalid organizer'
        return null
      },
      types: (value) => value.length > 0 ? null : 'At least one type is required',
    },
  })

  const organizerOptions = useMemo(() => {
    return Array.from(organizers)
    .map(([alias, { displayName }]) => ({ value: alias, label: displayName }))
    .sort((a, b) => a.label.localeCompare(b.label))
  }, [organizers])

  const handleLockChange = async (locked: boolean): Promise<boolean> => {
    if (!serie) return false

    return new Promise(async (resolve) => {
      try {
        await adminApi.update.serieLock(serie.year, serie.hash, locked)

        onSerieChange()

        resolve(true)
      } catch (error) {
        showErrorMessage({ title: 'Error', message: (error as any).message })
        resolve(false)
      }
    })
  }

  const handleSubmit = async (values: FormValues) => {
    try {
      const payload: CreateSerie = {
        ...serie,
        name: values.name,
        alias: values.alias,
        year: values.year,
        organizerAlias: values.organizerAlias!,
        types: values.types,
      }

      let updatedSerie

      if (serie) {
        updatedSerie = await adminApi.update.serie(serie.year, serie.hash, payload as UpdateSerie)
      } else {
        updatedSerie = await adminApi.create.serie(payload)
      }

      showSuccessMessage({ message: 'Serie updated successfully' })
      onSerieChange()

      if (!serie) navigate(`/admin/series/${updatedSerie.year}/${updatedSerie.hash}`)
    } catch (error) {
      showErrorMessage({ title: 'Error', message: (error as any).message })
    }
  }

  return (
    <>
      <Breadcrumbs mb="md">
        <Anchor size="sm" onClick={() => navigate(`/admin/series?year=${serie?.year || CURRENT_YEAR}`)}>Series</Anchor>
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
              <h2 style={{ marginTop: 0, marginBottom: 0 }}>{serie ? serie.name : 'Create New Serie'}</h2>
            </div>
          </Group>
        </div>
      </Group>

      <TabBar year={serie?.year} serieHash={serie?.hash || ''} serie={serie}/>

      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <Fieldset legend="Basic Information">
            <Stack gap="sm">
              <Grid>
                <Grid.Col span={8}>
                  <TextInput
                    label="Name"
                    required
                    {...form.getInputProps('name')}
                    onChange={(e) => {
                      const name = e.currentTarget.value
                      form.setFieldValue('name', name)
                      if (!aliasManuallyEdited) {
                        form.setFieldValue('alias', getSerieAliasFromName(name))
                      }
                    }}
                    styles={getFieldStyles('name')}
                  />
                </Grid.Col>

                <Grid.Col span={4}>
                  <TextInput
                    label="Alias"
                    required
                    disabled={!isAdmin}
                    {...form.getInputProps('alias')}
                    onChange={(e) => {
                      setAliasManuallyEdited(true)
                      form.setFieldValue('alias', e.currentTarget.value)
                    }}
                    styles={getFieldStyles('alias')}
                  />
                </Grid.Col>
              </Grid>

              <Grid>
                <Grid.Col span={4}>
                  <TextInput
                    label="Year"
                    required
                    type="number"
                    disabled={!isAdmin || !!serie}
                    {...form.getInputProps('year')}
                    onChange={(event) => form.setFieldValue('year', +event.currentTarget.value)}
                    styles={getFieldStyles('year')}
                  />
                </Grid.Col>

                <Grid.Col span={8}>
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
              </Grid>

              <Box>
                <Text size="sm" fw={500} mb={8}>Standings Types <span style={{ color: 'red' }}>*</span></Text>
                <Checkbox.Group
                  {...form.getInputProps('types')}
                >
                  <Group gap="xl">
                    <Checkbox value="individual" label="Individual" disabled/>
                    <Checkbox value="team" label="Team"/>
                  </Group>
                </Checkbox.Group>
                {form.errors.types && (
                  <Text size="xs" c="red" mt={4}>{form.errors.types}</Text>
                )}
              </Box>
            </Stack>
          </Fieldset>

          {!!serie && (
            <RequireAdmin>
              <Box p="md" bg="gray.0" style={{ borderRadius: '8px' }}>
                <Grid>
                  <Grid.Col span={4}>
                    <Box>
                      <Text size="sm" fw={500} mb={4}>Created</Text>
                      <Text size="sm" c="dimmed">
                        {serie.createdAt ? new Date(serie.createdAt).toLocaleString() : 'N/A'}
                      </Text>
                      <Text size="xs" c="dimmed">
                        by <HistoryAdminUserText userId={serie.createdBy}/>
                      </Text>
                    </Box>
                  </Grid.Col>

                  <Grid.Col span={4}>
                    <Box>
                      <Text size="sm" fw={500} mb={4}>Last Updated</Text>
                      <Text size="sm" c="dimmed">
                        {serie.updatedAt ? new Date(serie.updatedAt).toLocaleString() : 'N/A'}
                      </Text>
                      {serie.updatedBy && (
                        <Text size="xs" c="dimmed">
                          by <HistoryAdminUserText userId={serie.updatedBy}/>
                        </Text>
                      )}
                    </Box>
                  </Grid.Col>

                  {serie.source === 'ingest' && (
                    <Grid.Col span={4}>
                      <Box>
                        <Text size="sm" fw={500} mb={4}>Overwrite Protection</Text>
                        <Group gap="xs" wrap="nowrap" align="flex-start">
                          <UserLockSwitch
                            initialValue={serie.userLocked}
                            onChange={handleLockChange}
                          />

                          <Text size="xs" c="dimmed" pt={3}>
                            {serie.userLocked ? <>Serie information cannot be overwritten by automatic ingest<br/>(standings
                              are handled separately).</> : <>Automatic ingest may overwrite manual changes in serie
                              information<br/>(standings are handled separately).</>}
                          </Text>
                        </Group>
                      </Box>
                    </Grid.Col>
                  )}
                </Grid>
              </Box>
            </RequireAdmin>
          )}
        </Stack>

        <Group justify="flex-end" mt="md">
          <Button type="button" variant="light" onClick={() => navigate(`/admin/series?year=${serie?.year}`)}>
            Cancel
          </Button>

          <Button type="submit" disabled={!hasFormChanges}>
            Save Changes
          </Button>
        </Group>
      </form>
    </>
  )
}
