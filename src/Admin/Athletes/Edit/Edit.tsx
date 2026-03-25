import { Button, Divider, Fieldset, Grid, Group, LoadingOverlay, Select, Stack, Text, TextInput } from '@mantine/core'
import { DatePickerInput } from '@mantine/dates'
import { useForm } from '@mantine/form'
import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import type { Athlete, TDiscipline, Team } from '../../../../shared/types'
import { Loader } from '../../../Loader/Loader'
import { showErrorMessage } from '../../../utils/showErrorMessage'
import { showSuccessMessage } from '../../../utils/showSuccessMessage'
import { adminApi } from '../../utils/api'
import { useFormChanges } from '../../utils/useFormChanges'

type AdminAthleteEditProps = {
  teams: Team[]
  loading: boolean
  onChange: () => void
}

const TEAM_YEARS = Array.from({ length: 2 }, (_, i) => new Date().getFullYear() - i)
const CURRENT_YEAR = new Date().getFullYear()

// Generate birth year options from 1950 to 10 years ago
const BIRTH_YEAR_OPTIONS = Array.from(
  { length: new Date().getFullYear() - 10 - 1950 + 1 },
  (_, i) => {
    const year = new Date().getFullYear() - 10 - i
    return { value: year.toString(), label: year.toString() }
  }
)

type FormValues = Omit<Partial<Athlete>, 'birthYear' | 'latestUpgrade'> & {
  birthYear?: string
  latestUpgrade?: {
    ROAD?: {
      date?: string | null
      confidence: number
    }
    CX?: {
      date?: string | null
      confidence: number
    }
  }
}

export const AdminAthleteEdit: React.FC<AdminAthleteEditProps> = ({ teams, loading, onChange }) => {
  const [loadingData, setLoadingData] = useState<boolean>(true)
  const [athlete, setAthlete] = useState<Athlete | null>(null)
  const [saving, setSaving] = useState(false)
  const params = useParams<{ athleteUciId: string }>()
  const navigate = useNavigate()

  useEffect(() => {
    const fetchData = async () => {
      if (!params.athleteUciId) {
        showErrorMessage({ title: 'Error', message: 'No athlete UCI ID provided in URL' })
        setLoadingData(false)
        return
      }

      try {
        setLoadingData(true)

        const athlete = await adminApi.get.athlete(params.athleteUciId)

        setAthlete(athlete)
      } catch (error) {
        showErrorMessage({ title: 'Error', message: (error as any).message })
      } finally {
        setLoadingData(false)
      }
    }

    fetchData()
  }, [])

  const initialValues: FormValues = useMemo(() => {
    return {
      uciId: athlete?.uciId!,
      firstName: athlete?.firstName || '',
      lastName: athlete?.lastName || '',
      gender: athlete?.gender,
      city: athlete?.city || '',
      province: athlete?.province || '',
      nationality: athlete?.nationality || '',
      birthYear: athlete?.birthYear?.toString() ?? '',
      licenses: athlete?.licenses || {},
      teams: athlete?.teams || {},
      skillLevel: athlete?.skillLevel || { ROAD: undefined, CX: undefined },
      ageCategory: athlete?.ageCategory || { ROAD: undefined, CX: undefined },
      latestUpgrade: athlete?.latestUpgrade || {
        ROAD: { date: undefined, confidence: 0.8 },
        CX: { date: undefined, confidence: 0.8 }
      },
    }
  }, [athlete])

  const { getFieldStyles, hasFormChanges, onFormValuesChange, resetInitialValues } = useFormChanges(initialValues)
  const form = useForm<FormValues>({
    onValuesChange: onFormValuesChange,
  })

  // Reset form values whenever initialValues change (e.g., when athleteManualEdits are loaded)
  useEffect(() => {
    form.setValues(initialValues)
    resetInitialValues(initialValues)
  }, [initialValues])

  const handleSubmit = async (values: typeof form.values) => {
    try {
      setSaving(true)

      if (!athlete) {
        showErrorMessage({ title: 'Error', message: 'Base athlete not found' })
        return
      }

      const formattedValues: Partial<Athlete> = {
          ...values,
          birthYear: values.birthYear ? parseInt(values.birthYear) : undefined,
          latestUpgrade: {
            ROAD: values.latestUpgrade?.ROAD?.date !== undefined
              ? { date: values.latestUpgrade.ROAD.date, confidence: 0.8 }
              : undefined,
            CX: values.latestUpgrade?.CX?.date !== undefined
              ? { date: values.latestUpgrade.CX.date, confidence: 0.8 }
              : undefined,
          },
        }

        // Remove empty strings to avoid overwriting existing data with empty values
      ;(Object.keys(formattedValues) as Array<keyof typeof formattedValues>).forEach((key) => {
        if (['skillLevel', 'ageCategory'].includes(key)) {
          // @ts-ignore
          ;(Object.keys(formattedValues[key]) as Array<TDiscipline>).forEach((discipline) => {
            // @ts-ignore
            if (formattedValues[key][discipline] === '') {
              // @ts-ignore
              delete formattedValues[key][discipline]
            }
          })
        } else if (formattedValues[key] === '') {
          // @ts-ignore
          if (initialValues[key]) {
            // @ts-ignore
            formattedValues[key] = null // Set to null to indicate deletion of existing value
          } else {
            delete formattedValues[key]
          }
        }
      })

      // Here you would call your API to save the manual edits
      await adminApi.update.athlete({
        ...formattedValues,
        uciId: athlete.uciId,
      })

      showSuccessMessage({
        title: 'Success',
        message: `Athlete ${values.firstName} ${values.lastName} has been successfully updated!`
      })

      onChange()

      navigate('/admin/athletes')
    } catch (error) {
      showErrorMessage({ title: 'Error', message: (error as any).message })
    } finally {
      setSaving(false)
    }
  }

  // Get the most recent update date
  const getLastUpdatedDate = () => {
    const athleteLastUpdated = athlete?.lastUpdated

    const date = new Date(athleteLastUpdated!)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')

    return `${year}-${month}-${day}, ${hours}:${minutes}`
  }

  const teamOptions = useMemo(() =>
      teams.filter(team => !team.deleted).map((team) => ({ value: team.id.toString(), label: team.name })).sort((
        a,
        b
      ) => a.label.localeCompare(b.label)),
    [teams]
  )

  return (
    <>
      <Group justify="space-between" style={{ alignItems: 'flex-start' }}>
        <div>
          <Group gap={5} style={{ alignItems: 'center' }}>
            <h2 style={{ marginTop: 0, marginBottom: 0 }}>Edit Athlete</h2>
          </Group>
        </div>
      </Group>

      <Divider my="md"/>

      <LoadingOverlay
        visible={loading || loadingData} overlayProps={{ radius: 'sm', blur: 2 }}
        loaderProps={{
          children: <Loader text="Loading data..."/>,
        }}
      />

      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          {/* Basic Information */}
          <Fieldset legend="Basic Information">
            <Grid>
              <Grid.Col span={6}>
                <TextInput
                  label="UCI ID"
                  placeholder="Enter UCI ID (11 digits)"
                  {...form.getInputProps('uciId')}
                  disabled
                  styles={{
                    input: {
                      color: '#000000',
                      fontWeight: 500,
                      backgroundColor: '#f8f9fa',
                    }
                  }}
                />
              </Grid.Col>
              <Grid.Col span={3}>
                <Select
                  label="Gender"
                  placeholder="Select gender"
                  data={[
                    { value: 'M', label: 'Male' },
                    { value: 'F', label: 'Female' },
                    { value: 'X', label: 'Other' }
                  ]}
                  clearable
                  {...form.getInputProps('gender')}
                  styles={getFieldStyles('gender')}
                />
              </Grid.Col>
              <Grid.Col span={3}>
                <Select
                  label="Birth Year"
                  placeholder="Select birth year"
                  data={BIRTH_YEAR_OPTIONS}
                  searchable
                  clearable
                  {...form.getInputProps('birthYear')}
                  styles={getFieldStyles('birthYear')}
                />
              </Grid.Col>
            </Grid>
            <Grid>
              <Grid.Col span={6}>
                <TextInput
                  label="First Name"
                  placeholder="Enter first name"
                  {...form.getInputProps('firstName')}
                  styles={getFieldStyles('firstName')}
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <TextInput
                  label="Last Name"
                  placeholder="Enter last name"
                  {...form.getInputProps('lastName')}
                  styles={getFieldStyles('lastName')}
                />
              </Grid.Col>
              <Grid.Col span={4}>
                <TextInput
                  label="City"
                  placeholder="Enter city"
                  {...form.getInputProps('city')}
                  styles={getFieldStyles('city')}
                />
              </Grid.Col>
              <Grid.Col span={4}>
                <TextInput
                  label="Province"
                  placeholder="Enter province"
                  {...form.getInputProps('province')}
                  styles={getFieldStyles('province')}
                />
              </Grid.Col>
              <Grid.Col span={4}>
                <TextInput
                  label="Nationality"
                  placeholder="Enter nationality (e.g., CAN)"
                  {...form.getInputProps('nationality')}
                  styles={getFieldStyles('nationality')}
                />
              </Grid.Col>
            </Grid>
          </Fieldset>

          {/* Teams */}
          <Fieldset legend="Team">
            <Grid>
              {TEAM_YEARS.map((year) => (
                <Grid.Col span={6} key={year}>
                  <Select
                    label={`${year} Team`}
                    placeholder="Select a team"
                    data={teamOptions}
                    value={form.values.teams?.[year]?.id?.toString() || ''}
                    disabled={year !== CURRENT_YEAR}
                    onChange={(value) => {
                      if (value) {
                        form.setFieldValue(`teams.${year}`, {
                          id: parseInt(value),
                          name: teams.find(t => t.id.toString() === value)?.name || ''
                        })
                      } else {
                        const currentTeams = { ...form.values.teams }
                        currentTeams[year] = null
                        form.setFieldValue('teams', currentTeams)
                      }
                    }}
                    error={form.errors[`teams.${year}.id`]}
                    styles={getFieldStyles(`teams.${year}.id`)}
                    clearable
                    searchable
                  />
                </Grid.Col>
              ))}
            </Grid>
          </Fieldset>

          {/* Skill Levels */}
          <Fieldset legend="Road Skill Level">
            <Grid>
              <Grid.Col span={6}>
                <Select
                  label="Race Category"
                  placeholder="Select skill level"
                  data={[
                    { value: '1', label: 'Category 1' },
                    { value: '2', label: 'Category 2' },
                    { value: '3', label: 'Category 3' },
                    { value: '4', label: 'Category 4' },
                    { value: '5', label: 'Category 5' }
                  ]}
                  {...form.getInputProps('skillLevel.ROAD')}
                  styles={getFieldStyles('skillLevel.ROAD')}
                  clearable
                />
              </Grid.Col>

              <Grid.Col span={6}>
                <Select
                  label="Age Category"
                  placeholder="Select age category"
                  data={[
                    { value: 'ELITE', label: 'Elite' },
                    { value: 'JUNIOR', label: 'Junior' },
                    { value: 'U23', label: 'Under 23' },
                    { value: 'U19', label: 'Under 19' },
                    { value: 'U17', label: 'Under 17' },
                    { value: 'U15', label: 'Under 15' },
                    { value: 'U13', label: 'Under 13' },
                    { value: 'MASTER', label: 'Master' }
                  ]}
                  {...form.getInputProps('ageCategory.ROAD')}
                  styles={getFieldStyles('ageCategory.ROAD')}
                  clearable
                />
              </Grid.Col>

              <Grid.Col span={6}>
                <DatePickerInput
                  label="Latest Upgrade"
                  placeholder="Enter date of upgrade"
                  maxDate={new Date()}
                  valueFormat="YYYY-MM-DD"
                  clearable
                  {...form.getInputProps('latestUpgrade.ROAD.date')}
                  styles={getFieldStyles('latestUpgrade.ROAD.date')}
                />
              </Grid.Col>
            </Grid>
          </Fieldset>

          {/* Age Categories */}
          <Fieldset legend="Cyclocross Skill Level">
            <Grid>
              <Grid.Col span={6}>
                <Select
                  label="Race Category"
                  placeholder="Select skill level"
                  data={[
                    { value: '1', label: 'Category 1' },
                    { value: '2', label: 'Category 2' },
                    { value: '3', label: 'Category 3' },
                    { value: '4', label: 'Category 4' },
                    { value: '5', label: 'Category 5' }
                  ]}
                  {...form.getInputProps('skillLevel.CX')}
                  styles={getFieldStyles('skillLevel.CX')}
                  clearable
                />
              </Grid.Col>

              <Grid.Col span={6}>
                <Select
                  label="Cyclocross Age Category"
                  placeholder="Select age category"
                  data={[
                    { value: 'ELITE', label: 'Elite' },
                    { value: 'JUNIOR', label: 'Junior' },
                    { value: 'U23', label: 'Under 23' },
                    { value: 'U19', label: 'Under 19' },
                    { value: 'U17', label: 'Under 17' },
                    { value: 'U15', label: 'Under 15' },
                    { value: 'U13', label: 'Under 13' },
                    { value: 'MASTER', label: 'Master' }
                  ]}
                  {...form.getInputProps('ageCategory.CX')}
                  styles={getFieldStyles('ageCategory.CX')}
                  clearable
                />
              </Grid.Col>

              <Grid.Col span={6}>
                <DatePickerInput
                  label="Latest Upgrade"
                  placeholder="Enter date of upgrade"
                  maxDate={new Date()}
                  valueFormat="YYYY-MM-DD"
                  clearable
                  {...form.getInputProps('latestUpgrade.CX.date')}
                  styles={getFieldStyles('latestUpgrade.CX.date')}
                />
              </Grid.Col>
            </Grid>
          </Fieldset>

          <Group justify="space-between" align="center" mt="md">
            <Text size="sm" c="dimmed">
              {getLastUpdatedDate() && `Last updated: ${getLastUpdatedDate()}`}
            </Text>

            <Group>
              <Button
                type="button"
                variant="light"
                onClick={() => {
                  navigate('/admin/athletes')
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={saving}
                disabled={!hasFormChanges}
              >
                Save Changes
              </Button>
            </Group>
          </Group>
        </Stack>
      </form>
    </>
  )
}