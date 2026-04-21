import { Stepper, } from '@mantine/core'
import React, { useState } from 'react'
import { FileUploadStep, } from './FileUploadStep/FileUploadStep'
import { MapColumnStep } from './MapColumnStep/MapColumnStep'

export type ImportFields = { key: string; label: string }[]

export const ATHLETE_FIELDS: ImportFields = [
  { key: 'bibNumber', label: 'Bib Number' },
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
]
export type AthleteFieldKey = typeof ATHLETE_FIELDS[number]['key']
export type AthleteDataMapping = Record<AthleteFieldKey, string | null>
export type CSVSheets = Record<string, string>
export type DataMapping = AthleteDataMapping & Record<string, string | null>
export type ImportResult = Record<string, any>

export type FileUploadModalProps<R extends ImportResult> = {
  activeCategoryLabel: string
  hasExistingResults: boolean
  athleteFields?: ImportFields
  otherFields?: ImportFields
  otherFieldSectionLabel?: string
  onImport: (results: R[]) => void
  onClose: () => void
}

export function FileUploadModal<R extends ImportResult>({
  activeCategoryLabel,
  hasExistingResults,
  athleteFields = ATHLETE_FIELDS,
  otherFields = [],
  otherFieldSectionLabel,
  onImport,
  onClose,
}: FileUploadModalProps<R>): React.ReactElement {
  const [step, setStep] = useState<'upload' | 'mapping'>('upload')

  const [fileContent, setFileContent] = useState<CSVSheets>({})

  const handleFileUpload = (content: Record<string, string>) => {
    setFileContent(content)

    setStep('mapping')
  }

  const handleImport = (results: R[]) => {
    onImport(results)
    onClose()
  }

  return (
    <>
      <Stepper active={step === 'upload' ? 0 : 1} mb="xl" size="sm">
        <Stepper.Step label="Upload file" description="Select a CSV or Excel file"/>
        <Stepper.Step label="Map columns" description="Match columns to standing fields"/>
      </Stepper>

      {step === 'upload' && (
        <FileUploadStep onFileUpload={handleFileUpload}/>
      )}

      {step === 'mapping' && (
        <MapColumnStep
          athleteFields={athleteFields}
          otherFields={otherFields}
          activeCategoryLabel={activeCategoryLabel}
          hasExistingResults={hasExistingResults}
          otherFieldSectionLabel={otherFieldSectionLabel}
          fileContent={fileContent}
          onImport={handleImport}
          onClose={onClose}
          onStepChange={setStep}
        />
      )}
    </>
  )
}
