import { Button, Divider, Grid, Group, LoadingOverlay, Stack, Tabs, TextInput, } from '@mantine/core'
import { useForm } from '@mantine/form'
import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import type { Athlete, Team, TeamRoster } from '../../../../shared/types'
import { Loader } from '../../../Loader/Loader'
import { showErrorMessage } from '../../../utils/showErrorMessage'
import { showSuccessMessage } from '../../../utils/showSuccessMessage'
import { TagInput } from '../../Shared/TagInput/TagInput'
import { adminApi } from '../../utils/api'
import { useFormChanges } from '../../utils/useFormChanges'
import { TeamRosterForm } from './TeamRoster/TeamRoster'

type AdminTeamEditProps = {
  teamId?: string
  team?: Team
  teamRoster: TeamRoster | null
  allTeams: Team[]
  athletes: Athlete[]
  loading: boolean
  onChange: () => void
}

type FormValues = {
  id?: number
  name: string
  city: string
  website: string
  alternateNames: string[]
  uniqueKeywords: string[]
}

export const AdminTeamEdit: React.FC<AdminTeamEditProps> = ({
  teamId,
  team,
  teamRoster,
  allTeams,
  athletes,
  loading,
  onChange
}) => {
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<string | null>('info')
  const navigate = useNavigate()

  const initialValues: FormValues = useMemo(() => ({
    id: team?.id,
    name: team?.name || '',
    city: team?.city || '',
    website: team?.website || '',
    alternateNames: team?.alternateNames || [],
    uniqueKeywords: team?.uniqueKeywords || []
  }), [team])

  const { getFieldStyles, hasFormChanges } = useFormChanges(initialValues)
  const form = useForm<FormValues>()

  // Reset form values whenever team changes
  useEffect(() => {
    form.setValues(initialValues)
  }, [initialValues])

  const handleSubmit = async (values: typeof form.values) => {
    try {
      setSaving(true)

      if (!teamId) {
        // Create new team
        await adminApi.create.team(values)
      } else {
        // Update existing team
        await adminApi.update.team(values as Team)
      }

      showSuccessMessage({
        title: 'Success',
        message: teamId ? `Team ${values.name} has been successfully updated!` : `Team ${values.name} has been successfully created!`
      })

      onChange()
      navigate('/admin/teams')
    } catch (error) {
      showErrorMessage({ title: 'Error', message: (error as any).message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Group justify="space-between" style={{ alignItems: 'flex-start' }}>
        <div>
          <Group gap={5} style={{ alignItems: 'center' }}>
            <h2 style={{ marginTop: 0, marginBottom: 0 }}>{teamId ? `Edit Team: ${team?.name}` : 'Add New Team'}</h2>
          </Group>
        </div>
      </Group>

      <Divider my="md"/>

      <LoadingOverlay
        visible={loading} overlayProps={{ radius: 'sm', blur: 2 }}
        loaderProps={{
          children: <Loader text="Loading data..."/>,
        }}
      />

      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="info">Information</Tabs.Tab>
          <Tabs.Tab value="roster" disabled={!teamId}>Roster</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="info" pt="md">
          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack gap="md">

              <Grid>
                <Grid.Col span={6}>
                  <TextInput
                    label="Team Name"
                    placeholder="Enter team name"
                    required
                    {...form.getInputProps('name')}
                    styles={getFieldStyles('name')}
                  />
                </Grid.Col>
                <Grid.Col span={6}>
                  <TextInput
                    label="City"
                    placeholder="Enter team city"
                    {...form.getInputProps('city')}
                    styles={getFieldStyles('city')}
                  />
                </Grid.Col>
              </Grid>
              <Grid>
                <Grid.Col span={12}>
                  <TextInput
                    label="Website"
                    placeholder="Enter team website URL"
                    {...form.getInputProps('website')}
                    styles={getFieldStyles('website')}
                  />
                </Grid.Col>
              </Grid>

              <Grid>
                <Grid.Col span={6}>
                  <TagInput
                    label="Alternate Names"
                    placeholder="Enter names (separated by a comma)"
                    value={form.values.alternateNames}
                    onChange={(values) => form.setFieldValue('alternateNames', values)}
                    styles={getFieldStyles('alternateNames')}
                  />
                </Grid.Col>

                <Grid.Col span={6}>
                  <TagInput
                    label="Unique Keywords"
                    placeholder="Add unique keywords for team identification (separated by a comma)"
                    value={form.values.uniqueKeywords}
                    onChange={(values) => form.setFieldValue('uniqueKeywords', values)}
                    styles={getFieldStyles('uniqueKeywords')}
                  />
                </Grid.Col>
              </Grid>

              <Group justify="flex-end" mt="md">
                <Button
                  type="button"
                  variant="light"
                  onClick={() => navigate('/admin/teams')}
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  loading={saving}
                  disabled={!hasFormChanges}
                >
                  {teamId ? 'Save Changes' : 'Create Team'}
                </Button>
              </Group>
            </Stack>
          </form>
        </Tabs.Panel>

        <Tabs.Panel value="roster" pt="md">
          {team && (
            <TeamRosterForm team={team} teamRoster={teamRoster} allTeams={allTeams} athletes={athletes}
                            onChange={onChange}/>
          )}
        </Tabs.Panel>
      </Tabs>
    </>
  )
}