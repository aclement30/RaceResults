import { AppShell, Button, Divider, Grid, Group, NavLink, Stack, Text, Center, LoadingOverlay } from '@mantine/core'
import { IconCloudDownload, IconFileText } from '@tabler/icons-react'
import { AdminNavbar } from '../Navbar/Navbar'
import { JsonEditor, isValidJson } from 'modern-json-react'
import { useState, useEffect, useMemo } from 'react'
import { showErrorMessage } from '../../utils/showErrorMessage'
import { adminApi } from '../utils/api'

import 'modern-json-react/styles.css'
import { ENV } from '../utils/config'
import { Loader } from '../../Loader/Loader'

const EDITABLE_FILES: Record<string, string> = {
  'athlete_overrides.json': 'Athlete Overrides',
  'athlete_duplicates.json': 'Duplicate Athletes',
  'event_days.json': 'Event Days',
}

export const AdminConfigurationFileEditor = () => {
  const [selectedFile, setSelectedFile] = useState<string | null>()
  const [data, setData] = useState<any>()
  const [originalData, setOriginalData] = useState<any>()
  const [alternateVersionData, setAlternateVersionData] = useState<any>()
  const [saving, setSaving] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)

  // Check if current data differs from original loaded data
  const hasFormChanges = useMemo(() => {
    if (!originalData || !data) return false
    return JSON.stringify(originalData) !== JSON.stringify(data)
  }, [originalData, data])

  const isDifferentFromAlternateVersion = useMemo(() => {
    if (!alternateVersionData || !data) return true
    return JSON.stringify(alternateVersionData) !== JSON.stringify(data)
  }, [alternateVersionData, data])

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedFile) return

      setLoading(true)
      try {
        const fileContent = await adminApi.get.settingConfigFile(selectedFile)
        setData(fileContent)
        setOriginalData(fileContent) // Store original data for comparison
      } catch (error) {
        showErrorMessage({
          title: 'File Loading Error',
          message: `Failed to load ${selectedFile}: ${(error as Error).message}`
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [selectedFile])

  const copyAlternateVersion = async () => {
    try {
      if (!selectedFile) return

      setLoading(true)

      const alternateFileContent = await adminApi.get.settingConfigFile(selectedFile, ENV === 'production' ? 'stage' : 'production')

      setData(alternateFileContent)
      setAlternateVersionData(alternateFileContent)
    } catch (error) {
      showErrorMessage({
        title: 'File Loading Error',
        message: `Failed to load ${selectedFile}: ${(error as Error).message}`
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    setSaving(true)

    try {
      if (!selectedFile) return

      if (!isValidJson(JSON.stringify(data))) {
        showErrorMessage({ title: 'JSON Error', message: 'Please make sure that the file content is valid JSON' })
        return
      }

      await adminApi.update.settingConfigFile(selectedFile, data)

      setOriginalData(data)
    } catch (error) {
      showErrorMessage({
        title: 'Save Error',
        message: `Failed to save ${selectedFile}: ${(error as Error).message}`
      })
    } finally {
      setSaving(false)
    }
  }

  const resetEditor = () => {
    setSelectedFile(null)
    setData(undefined)
    setOriginalData(undefined)
  }

  return (
    <>
      <AdminNavbar/>

      <AppShell.Main style={{
        backgroundImage: 'url(/header-bg.png)',
        backgroundPosition: 'top 60px right',
        backgroundRepeat: 'no-repeat',
        height: '100vh',
        overflow: 'hidden',
        minHeight: 0,
      }}>
        <div style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ flex: '0 0 auto' }}>
            <Group justify="space-between" style={{ alignItems: 'flex-start' }}>
              <div>
                <Group gap={5} style={{ alignItems: 'center' }}>
                  <h2 style={{ marginTop: 0, marginBottom: 0 }}>Configuration Files</h2>
                </Group>
              </div>
            </Group>

            <Divider my="md"/>
          </div>

          <Grid styles={{
            root: {
              flex: '1 1 auto',
              margin: 0,
              height: '100%',
              minHeight: 0,
            },
            inner: {
              height: '100%',
              minHeight: 0,
            }
          }}>
            <Grid.Col span={2}>
              {Object.entries(EDITABLE_FILES).map(([path, key]) => (
                <NavLink
                  key={path}
                  description={path}
                  label={key}
                  onClick={() => setSelectedFile(path)}
                  disabled={!!selectedFile && hasFormChanges && selectedFile !== path}
                  active={selectedFile === path}
                />
              ))}
            </Grid.Col>

            <Grid.Col span={10} style={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0,
              overflow: 'hidden'
            }}>
              {selectedFile ? (
                <div style={{ height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                  <Group justify="space-between" mb="md" style={{ flex: '0 0 auto' }}>
                    <Button
                      type="button"
                      onClick={() => copyAlternateVersion()}
                      variant="outline"
                      disabled={!selectedFile || !isDifferentFromAlternateVersion}
                      leftSection={<IconCloudDownload/>}
                    >
                      Copy from {ENV === 'production' ? 'stage' : 'production'}
                    </Button>

                    <Group>
                      <Button
                        type="button"
                        variant="light"
                        onClick={() => {
                          resetEditor()
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        onClick={handleSubmit}
                        loading={saving}
                        disabled={!hasFormChanges}
                      >
                        Save Changes
                      </Button>
                    </Group>
                  </Group>

                  <div style={{ flex: '1 1 auto', minHeight: 0, height: '100%' }}>
                    <LoadingOverlay
                      visible={loading} overlayProps={{ radius: 'sm', blur: 2 }}
                      loaderProps={{
                        children: <Loader text="Loading data..."/>,
                      }}
                    />

                    <JsonEditor
                      theme="auto"
                      value={data}
                      onChange={(value: any) => setData(value)}
                      height="100%"
                    />
                  </div>
                </div>
              ) : (
                <Center h="100%">
                  <Stack align="center" gap="md">
                    <IconFileText size={48} stroke={1.5} color="var(--mantine-color-gray-5)"/>
                    <Text size="lg" c="dimmed" ta="center">
                      Select a file to edit
                    </Text>
                    <Text size="sm" c="dimmed" ta="center">
                      Choose a configuration file from the list to view and edit its contents
                    </Text>
                  </Stack>
                </Center>
              )}
            </Grid.Col>
          </Grid>
        </div>
      </AppShell.Main>
    </>
  )
}