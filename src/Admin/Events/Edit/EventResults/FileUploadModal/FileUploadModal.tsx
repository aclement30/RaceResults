import React, { useState } from 'react'
import {
  Button,
  Divider,
  Grid,
  Group,
  ScrollArea,
  Select,
  Stack,
  Stepper,
  Table,
  Text,
  TextInput,
} from '@mantine/core'
import { Dropzone } from '@mantine/dropzone'
import { IconFile, IconUpload, IconX } from '@tabler/icons-react'
import { showErrorMessage } from '../../../../../utils/showErrorMessage'
import { autoDetect, parseWithMapping } from './utils'
import { modals } from '@mantine/modals'
import type { ParticipantResult } from '../../../../../../shared/types'

// The result fields we want to map CSV columns to
const RESULT_FIELDS = [
  // Position
  { key: 'position', label: 'Position' },
  // EventAthlete fields
  { key: 'bib', label: 'Bib Number' },
  { key: 'name', label: 'Athlete Name' },
  { key: 'firstName', label: 'First Name' },
  { key: 'lastName', label: 'Last Name' },
  { key: 'uciId', label: 'UCI ID' },
  { key: 'city', label: 'City' },
  { key: 'province', label: 'Province' },
  { key: 'team', label: 'Team' },
  { key: 'license', label: 'License' },
  { key: 'age', label: 'Age' },
  { key: 'nationality', label: 'Nationality' },
  // Timing data
  { key: 'finishTime', label: 'Finish Time' },
  { key: 'finishGap', label: 'Finish Gap' },
  { key: 'avgSpeed', label: 'Avg Speed' },
  { key: 'status', label: 'Status' },
] as const

type ResultFieldKey = typeof RESULT_FIELDS[number]['key']
export type ColumnMapping = Record<ResultFieldKey, string | null>

const MODAL_ID = 'file-upload-modal'

export const openFileUploadModal = (props: FileUploadModalProps) => {
  modals.open({
    modalId: MODAL_ID,
    title: 'Upload Results File',
    size: 'xl',
    children: (
      <FileUploadModal {...props}/>
    ),
  })
}

type FileUploadModalProps = {
  onImport: (categoryName: string, results: ParticipantResult[], mapping: ColumnMapping) => void
  savedMapping?: ColumnMapping | null
}

export const FileUploadModal: React.FC<FileUploadModalProps> = ({
  onImport,
  savedMapping,
}) => {
  const [step, setStep] = useState<'upload' | 'mapping'>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [fileContent, setFileContent] = useState<string>('')
  const [csvHeaders, setCsvHeaders] = useState<string[]>([])
  const [mapping, setMapping] = useState<ColumnMapping>({
    position: null, bib: null, name: null, firstName: null,
    lastName: null, team: null, finishTime: null, finishGap: null,
    avgSpeed: null, status: null, uciId: null, city: null,
    province: null, license: null, age: null, nationality: null,
  })
  const [categoryName, setCategoryName] = useState('')
  const [previewRows, setPreviewRows] = useState<string[][]>([])

  const handleClose = () => {
    modals.close(MODAL_ID)
  }

  const handleFileDrop = async (files: File[]) => {
    const f = files[0]
    if (!f) return
    try {
      const content = await f.text()
      const lines = content.trim().split(/\r?\n/)
      if (lines.length < 2) {
        showErrorMessage({
          title: 'Invalid file',
          message: 'The file must have at least a header row and one data row.'
        })
        return
      }
      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
      const preview = lines.slice(1, 4).map(l => l.split(',').map(c => c.trim().replace(/^"|"$/g, '')))

      setFile(f)
      setFileContent(content)
      setCsvHeaders(headers)
      const detected = autoDetect(headers)
      if (savedMapping) {
        const merged = { ...detected } as ColumnMapping
        for (const key of Object.keys(savedMapping) as (keyof ColumnMapping)[]) {
          const saved = savedMapping[key]
          if (saved && headers.includes(saved)) merged[key] = saved
        }
        setMapping(merged)
      } else {
        setMapping(detected)
      }
      const rawName = f.name.replace(/\.[^/.]+$/, '')
      const spaceMatch = rawName.match(/^(.+) - \1$/)
      const dashMatch = rawName.match(/^(.+)-\1$/)
      const cleanName = spaceMatch?.[1] ?? dashMatch?.[1] ?? rawName
      setCategoryName(cleanName)
      setPreviewRows(preview)
      setStep('mapping')
    } catch {
      showErrorMessage({ title: 'Error', message: 'Failed to read the file.' })
    }
  }

  const handleImport = () => {
    const results = parseWithMapping(fileContent, mapping)
    onImport(categoryName, results, mapping)
    handleClose()
  }

  const headerOptions = [
    { value: '__none__', label: '— None —' },
    ...csvHeaders.map(h => ({ value: h, label: h })),
  ]

  const setField = (key: ResultFieldKey, value: string | null) =>
    setMapping(prev => ({ ...prev, [key]: value === '__none__' ? null : value }))

  const activeStep = step === 'upload' ? 0 : 1

  return (
    <>
      <Stepper active={activeStep} mb="xl" size="sm">
        <Stepper.Step label="Upload file" description="Select a CSV file"/>
        <Stepper.Step label="Map columns" description="Match CSV columns to result fields"/>
      </Stepper>

      {step === 'upload' && (
        <Dropzone
          onDrop={handleFileDrop}
          onReject={() => showErrorMessage({ title: 'Invalid file', message: 'Only CSV files are accepted.' })}
          accept={['text/csv', 'text/plain', 'application/vnd.ms-excel']}
          maxFiles={1}
        >
          <Stack align="center" gap="xs" py="xl" style={{ pointerEvents: 'none' }}>
            <Dropzone.Accept>
              <IconUpload size={40} color="var(--mantine-color-blue-6)"/>
            </Dropzone.Accept>
            <Dropzone.Reject>
              <IconX size={40} color="var(--mantine-color-red-6)"/>
            </Dropzone.Reject>
            <Dropzone.Idle>
              <IconFile size={40} color="var(--mantine-color-gray-5)"/>
            </Dropzone.Idle>
            <Text size="md" fw={500}>Drop a CSV file here or click to browse</Text>
            <Text size="sm" c="dimmed">One file at a time. The filename will be used as the category name.</Text>
          </Stack>
        </Dropzone>
      )}

      {step === 'mapping' && (
        <Stack>
          <TextInput
            label="Category Name"
            value={categoryName}
            onChange={e => setCategoryName(e.target.value)}
            description={`Detected from filename: ${file?.name}`}
          />

          <Divider label="Column Mapping" labelPosition="left"/>

          <Grid gutter="xl" align="flex-start">
            <Grid.Col span={6}>
              <Text size="xs" fw={600} c="dimmed" tt="uppercase" mb={6}>Athlete</Text>
              <Table>
                <Table.Tbody>
                  {RESULT_FIELDS.filter(f =>
                    [
                      'bib',
                      'name',
                      'firstName',
                      'lastName',
                      'uciId',
                      'city',
                      'province',
                      'team',
                      'license',
                      'age',
                      'nationality'
                    ].includes(f.key)
                  ).map(({ key, label }) => (
                    <Table.Tr key={key}>
                      <Table.Td style={{ whiteSpace: 'nowrap' }}><Text size="sm">{label}</Text></Table.Td>
                      <Table.Td>
                        <Select
                          size="xs"
                          value={mapping[key] ?? '__none__'}
                          data={headerOptions}
                          onChange={v => setField(key, v)}
                          allowDeselect={false}
                        />
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Grid.Col>
            <Grid.Col span={6}>
              <Text size="xs" fw={600} c="dimmed" tt="uppercase" mb={6}>Race Result</Text>
              <Table>
                <Table.Tbody>
                  {RESULT_FIELDS.filter(f =>
                    ['position', 'finishTime', 'finishGap', 'avgSpeed', 'status'].includes(f.key)
                  ).map(({ key, label }) => (
                    <Table.Tr key={key}>
                      <Table.Td style={{ whiteSpace: 'nowrap' }}><Text size="sm">{label}</Text></Table.Td>
                      <Table.Td>
                        <Select
                          size="xs"
                          value={mapping[key] ?? '__none__'}
                          data={headerOptions}
                          onChange={v => setField(key, v)}
                          allowDeselect={false}
                        />
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Grid.Col>
          </Grid>

          {previewRows.length > 0 && (
            <>
              <Divider label="Preview (first 3 rows)" labelPosition="left"/>
              <ScrollArea offsetScrollbars w="100%">
                {(() => {
                  const previewColumns = RESULT_FIELDS
                  .filter(({ key }) => mapping[key] !== null)
                  .map(({ key, label }) => ({
                    label,
                    index: csvHeaders.indexOf(mapping[key]!),
                  }))
                  return (
                    <Table striped withTableBorder withColumnBorders fz="xs">
                      <Table.Thead>
                        <Table.Tr>
                          {previewColumns.map(col => (
                            <Table.Th key={col.label}>{col.label}</Table.Th>
                          ))}
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {previewRows.map((row, i) => (
                          <Table.Tr key={i}>
                            {previewColumns.map(col => (
                              <Table.Td key={col.label}>{row[col.index] ?? ''}</Table.Td>
                            ))}
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  )
                })()}
              </ScrollArea>
            </>
          )}

          <Group justify="space-between">
            <Button variant="subtle" onClick={() => setStep('upload')}>
              ← Back
            </Button>
            <Group>
              <Button variant="light" onClick={handleClose}>Cancel</Button>
              <Button onClick={handleImport} disabled={!categoryName.trim()}>
                Import
              </Button>
            </Group>
          </Group>
        </Stack>
      )}
    </>
  )
}
