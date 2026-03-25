import {
  Alert,
  AppShell,
  Button,
  Center,
  Divider,
  Grid,
  Group,
  LoadingOverlay,
  NavLink,
  Stack,
  Text
} from '@mantine/core'
import { IconCloudDownload, IconFileText } from '@tabler/icons-react'
import { highlight, languages } from 'prismjs/components/prism-core'
import 'prismjs/components/prism-json'
import 'prismjs/themes/prism.css'
import './AdminConfigurationFileEditor.css'
import { useEffect, useMemo, useState } from 'react'
import Editor from 'react-simple-code-editor'
import { EDITABLE_FILES } from '../../../shared/config'
import { Loader } from '../../Loader/Loader'
import { showErrorMessage } from '../../utils/showErrorMessage'
import { AdminNavbar } from '../Navbar/Navbar'

import { adminApi } from '../utils/api'
import { ENV } from '../utils/config'

export const AdminConfigurationFileEditor = () => {
  const [selectedFile, setSelectedFile] = useState<string | null>()
  const [data, setData] = useState<any>()
  const [originalData, setOriginalData] = useState<any>()
  const [alternateVersionData, setAlternateVersionData] = useState<any>()
  const [saving, setSaving] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)

  // Calculate line count to match editor behavior
  const lineCount = useMemo(() => {
    if (!data) return 1
    // Count line breaks and add 1, but ensure minimum of 1
    const matches = data.match(/\r?\n/g)
    const count = matches ? matches.length + 1 : 1
    return count
  }, [data])

  // Check if current data differs from original loaded data
  const hasFormChanges = useMemo(() => {
    if (!originalData || !data) return false
    return JSON.stringify(originalData) !== JSON.stringify(data)
  }, [originalData, data])

  const isDifferentFromAlternateVersion = useMemo(() => {
    if (!alternateVersionData || !data) return true
    return JSON.stringify(alternateVersionData) !== JSON.stringify(data)
  }, [alternateVersionData, data])

  const jsonValidationError = useMemo(() => {
    if (!data) return null

    try {
      JSON.parse(data)
      return null
    } catch (e) {
      const error = e as Error
      const message = error.message

      // Try to extract line number from error message
      const lineMatch = message.match(/at position (\d+)/) || message.match(/line (\d+)/) || message.match(/at (\d+):/)
      let lineNumber = null

      if (lineMatch) {
        const position = parseInt(lineMatch[1])
        // If it's a character position, convert to line number
        if (message.includes('position')) {
          const textUpToPosition = data.substring(0, position)
          lineNumber = textUpToPosition.split(/\r?\n/).length
        } else {
          lineNumber = position
        }
      }

      let formattedMessage = message.replace('JSON.parse:', '').replace('of the JSON data', '').trim()
      formattedMessage = formattedMessage.charAt(0).toUpperCase() + formattedMessage.slice(1)

      return {
        message: formattedMessage,
        lineNumber: lineNumber
      }
    }
  }, [data])

  // Track error lines for highlighting
  const errorLines = useMemo(() => {
    if (!jsonValidationError?.lineNumber) return new Set()
    return new Set([jsonValidationError.lineNumber])
  }, [jsonValidationError])

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedFile) return

      setLoading(true)
      try {
        const fileContent = await adminApi.get.settingConfigFile(selectedFile)

        const jsonString = JSON.stringify(fileContent, null, 2)
        setData(jsonString)
        setOriginalData(jsonString) // Store original data for comparison
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

      if (jsonValidationError) {
        showErrorMessage({
          title: 'JSON Error',
          message: 'Please make sure that the file content is valid JSON before saving changes.'
        })
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

                  <div style={{
                    flex: '1 1 auto',
                    minHeight: 0,
                    height: '100%',
                    overflow: 'auto',
                    border: '1px solid var(--mantine-color-gray-3)',
                    borderRadius: 'var(--mantine-radius-default)',
                    background: 'var(--mantine-color-body)',
                    transition: 'border-color 0.2s',
                  }} className="editor-with-line-numbers">
                    <div
                      className="line-numbers-bg"
                      style={{
                        height: `${lineCount * 1.5 * 12}px` /* No padding buffer needed */
                      }}
                    />

                    <LoadingOverlay
                      visible={loading} overlayProps={{ radius: 'sm', blur: 2 }}
                      loaderProps={{
                        children: <Loader text="Loading data..."/>,
                      }}
                    />

                    <div className="line-numbers">
                      {Array.from({ length: lineCount }, (_, i) => {
                        const lineNum = i + 1
                        const hasError = errorLines.has(lineNum)
                        return (
                          <div
                            key={i}
                            className={hasError ? 'error-line' : ''}
                            style={hasError ? { color: '#e03131', fontWeight: 'bold' } : {}}
                          >
                            {lineNum}
                          </div>
                        )
                      })}
                    </div>

                    <Editor
                      value={data}
                      onValueChange={value => setData(value)}
                      highlight={value => !!value && highlight(value, languages.json)}
                      padding={0}
                      style={{
                        fontFamily: '"Fira code", "Fira Mono", monospace',
                        fontSize: 12,
                        outline: 'none',
                      }}
                    />
                  </div>

                  {!!jsonValidationError && (
                    <Alert variant="light" color="red" radius={0} title="JSON Syntax Error" mt="sm" pt="xs">
                      {jsonValidationError?.message}
                    </Alert>
                  )}
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