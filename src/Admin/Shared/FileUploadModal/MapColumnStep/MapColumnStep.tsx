import { Alert, Button, Divider, Grid, Group, Input, ScrollArea, Select, Stack, Table, Text } from '@mantine/core'
import { IconAlertTriangle } from '@tabler/icons-react'
import React, { useEffect, useMemo, useState } from 'react'
import { MappingSelect } from '../FieldMappingSelect'
import { type CSVSheets, type DataMapping, type ImportFields, type ImportResult } from '../FileUploadModal'
import { autoDetectMapping, parseContentWithDataMapping, parseHeaders } from '../utils'

type MapColumnStepProps<R extends ImportResult> = {
  athleteFields: ImportFields
  otherFields?: ImportFields
  activeCategoryLabel: string
  hasExistingResults: boolean
  otherFieldSectionLabel?: string
  fileContent: CSVSheets
  onImport: (results: R[]) => void
  onClose: () => void
  onStepChange: (step: 'upload' | 'mapping') => void
}

export function MapColumnStep<R extends ImportResult>({
  athleteFields,
  otherFields,
  activeCategoryLabel,
  hasExistingResults,
  otherFieldSectionLabel = 'Result',
  fileContent,
  onImport,
  onClose,
  onStepChange,
}: MapColumnStepProps<R>): React.ReactElement {
  const [selectedSheet, setSelectedSheet] = useState<string | null>(Object.keys(fileContent)[0] ?? null)
  const [sourceFields, setSourceFields] = useState<string[]>([])

  const [mapping, setMapping] = useState<DataMapping>(
    // Initialize mapping with all possible fields set to null, so they show up in the mapping step even if auto-detection doesn't find a match
    [...athleteFields, ...(otherFields || [])].reduce((
      acc, { key }
    ) => ({ ...acc, [key]: null }), {})
  )

  console.log({ fileContent, selectedSheet, sourceFields, mapping })
  const sourceFieldOptions = useMemo(() => [
    { value: '__none__', label: '— None —' },
    ...sourceFields.map(h => ({ value: h, label: h })),
  ], [sourceFields])

  const allTargetFieldKeys = useMemo(() => [
    ...athleteFields.map(({ key }) => key),
    ...(otherFields?.map(({ key }) => key) || [])
  ], [athleteFields, otherFields])

  // Retrieve saved mapping from sessionStorage based on the current combination of target fields
  const savedMapping = useMemo(() => {
    const mappingKey = allTargetFieldKeys.join()

    const rawMapping = sessionStorage.getItem(mappingKey)
    const savedMapping: DataMapping = rawMapping ? JSON.parse(rawMapping) : ({} as DataMapping)

    return savedMapping
  }, [allTargetFieldKeys])

  const previewRows = useMemo(() => {
    if (!fileContent || !selectedSheet) return []

    const dataRows = parseContentWithDataMapping(fileContent[selectedSheet], mapping)

    return dataRows.slice(0, 3)
  }, [fileContent, selectedSheet, mapping])

  const getInitialMapping = (sourceFields: string[]) => {
    const detectedMapping = autoDetectMapping(sourceFields, allTargetFieldKeys)

    if (!savedMapping) return detectedMapping

    return Object.fromEntries(
      Object.entries(detectedMapping).map(([k, v]) => {
        const saved = savedMapping[k as keyof DataMapping]
        return [k, saved && sourceFields.includes(saved) ? saved : v]
      })
    ) as DataMapping
  }

  useEffect(() => {
    if (!fileContent || !selectedSheet) return

    const headers = parseHeaders(fileContent[selectedSheet])

    setSourceFields(headers)
    setMapping(getInitialMapping(headers))
  }, [fileContent, selectedSheet])

  const handleImport = () => {
    if (!fileContent || !selectedSheet) return

    const results: R[] = parseContentWithDataMapping(fileContent[selectedSheet], mapping)

    // Save data mapping
    const mappingKey = allTargetFieldKeys.join()
    sessionStorage.setItem(mappingKey, JSON.stringify(mapping))

    onImport(results)
  }

  const setFieldMapping = (targetField: string, sourceField: string | null | '__none__') => {
    setMapping({ ...mapping, [targetField]: sourceField !== '__none__' ? sourceField : null })
  }

  const hasMultipleSheets = Object.keys(fileContent).length > 1

  return (
    <Stack>
      <Grid>
        <Grid.Col span={hasMultipleSheets ? 6 : 12}>
          <Input.Label>Category</Input.Label>
          <Text mt="5" fw="bold" fs="14px">{activeCategoryLabel}</Text>
        </Grid.Col>

        {hasMultipleSheets && (
          <Grid.Col span={6}>
            <Select
              label="Sheet"
              data={Object.keys(fileContent)}
              value={selectedSheet}
              onChange={setSelectedSheet}
              allowDeselect={false}
            />
          </Grid.Col>
        )}
      </Grid>

      {hasExistingResults && (
        <Alert p="xs" icon={<IconAlertTriangle size={16}/>} color="yellow" variant="light">
          This category already has standings. Importing this file will overwrite the existing data.
        </Alert>
      )}

      <Divider label="Column Mapping" labelPosition="left"/>

      <Grid gutter="xl" align="flex-start">
        <Grid.Col span={6}>
          <Text size="xs" fw={600} c="dimmed" tt="uppercase" mb={6}>Athlete</Text>

          <Table>
            <Table.Tbody>
              {athleteFields.map(({ key, label }) => (
                <Table.Tr key={key}>
                  <Table.Td style={{ whiteSpace: 'nowrap' }}><Text size="sm">{label}</Text></Table.Td>
                  <Table.Td>
                    <MappingSelect
                      value={mapping[key] ?? '__none__'}
                      data={sourceFieldOptions}
                      onChange={(value) => setFieldMapping(key, value)}
                    />
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Grid.Col>

        {!!otherFields?.length && (
          <Grid.Col span={6}>
            <Text size="xs" fw={600} c="dimmed" tt="uppercase" mb={6}>{otherFieldSectionLabel}</Text>

            <Table>
              <Table.Tbody>
                {otherFields.map(({ key, label }) => (
                  <Table.Tr key={key}>
                    <Table.Td style={{ whiteSpace: 'nowrap' }}><Text size="sm">{label}</Text></Table.Td>
                    <Table.Td>
                      <MappingSelect
                        value={mapping[key] ?? '__none__'}
                        data={sourceFieldOptions}
                        onChange={(value) => setFieldMapping(key, value)}
                      />
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Grid.Col>
        )}
      </Grid>

      {previewRows.length > 0 && (
        <>
          <Divider label="Preview (first 3 rows)" labelPosition="left"/>
          <ScrollArea offsetScrollbars w="100%">
            {(() => {
              const previewColumns = allTargetFieldKeys
              .filter(key => mapping[key] !== null)
              .map(key => ({ key, index: sourceFields.indexOf(mapping[key]!) }))

              return (
                <Table striped withTableBorder withColumnBorders fz="xs">
                  <Table.Thead>
                    <Table.Tr>
                      {previewColumns.map(col => <Table.Th key={col.key}>{col.key}</Table.Th>)}
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {previewRows.map((row, i) => (
                      <Table.Tr key={i}>
                        {previewColumns.map(col => <Table.Td
                          key={col.key}>{row[col.key] ?? ''}</Table.Td>)}
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
        <Button variant="subtle" onClick={() => onStepChange('upload')}>← Back</Button>
        <Group>
          <Button variant="light" onClick={onClose}>Cancel</Button>
          <Button onClick={handleImport}>Import</Button>
        </Group>
      </Group>
    </Stack>
  )
}