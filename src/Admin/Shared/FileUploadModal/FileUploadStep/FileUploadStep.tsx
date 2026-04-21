import { Stack, Text } from '@mantine/core'
import { Dropzone } from '@mantine/dropzone'
import { IconFile, IconUpload, IconX } from '@tabler/icons-react'
import React from 'react'
import { read, utils } from 'xlsx'
import { showErrorMessage } from '../../../../utils/showErrorMessage'
import type { CSVSheets } from '../FileUploadModal'

type FileUploadStepProps = {
  description?: string
  onFileUpload: (content: CSVSheets) => void
}

export const FileUploadStep: React.FC<FileUploadStepProps> = ({ description, onFileUpload }) => {
  const handleDrop = async (files: File[]) => {
    const file = files[0]

    if (!file) return

    const content: CSVSheets = {}

    try {
      const isExcel = /\.(xlsx|xls|ods)$/i.test(file.name)

      if (isExcel) {
        const arrayBuffer = await file.arrayBuffer()
        const workbook = read(arrayBuffer, { type: 'array' })
        const sheetNames = workbook.SheetNames

        if (!sheetNames.length) {
          showErrorMessage({ title: 'Invalid file', message: 'No sheets found in the workbook.' })
          return
        }

        sheetNames.forEach(sheetName => {
          content[sheetName] = utils.sheet_to_csv(workbook.Sheets[sheetName])
        })

        onFileUpload(content)
      } else {
        const csvString = await file.text()

        onFileUpload({
          [file.name]: csvString,
        })
      }
    } catch {
      showErrorMessage({ title: 'Error', message: 'Failed to read the file.' })
    }
  }

  return (
    <Dropzone
      onDrop={handleDrop}
      onReject={() => showErrorMessage({ title: 'Invalid file', message: 'Only CSV or Excel files are accepted.' })}
      accept={[
        'text/csv',
        'text/plain',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.oasis.opendocument.spreadsheet',
      ]}
      maxFiles={1}
    >
      <Stack align="center" gap="xs" py="xl" style={{ pointerEvents: 'none' }}>
        <Dropzone.Accept><IconUpload size={40} color="var(--mantine-color-blue-6)"/></Dropzone.Accept>
        <Dropzone.Reject><IconX size={40} color="var(--mantine-color-red-6)"/></Dropzone.Reject>
        <Dropzone.Idle><IconFile size={40} color="var(--mantine-color-gray-5)"/></Dropzone.Idle>
        <Text size="md" fw={500}>Drop a CSV or Excel file here or click to browse</Text>
        <Text size="sm" c="dimmed">{description ?? 'One file at a time.'}</Text>
      </Stack>
    </Dropzone>
  )
}
