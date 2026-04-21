import { modals } from '@mantine/modals'
import { ErrorBoundary } from '../../../../../Shared/ErrorBoundary/ErrorBoundary'
import {
  FileUploadModal,
  type FileUploadModalProps,
  type ImportFields,
  type ImportResult
} from '../../../../Shared/FileUploadModal/FileUploadModal'

const RACE_RESULT_FIELDS: ImportFields = [
  { key: 'position', label: 'Position' },
  { key: 'finishTime', label: 'Finish Time' },
  { key: 'finishGap', label: 'Finish Gap' },
  { key: 'avgSpeed', label: 'Avg Speed' },
  { key: 'status', label: 'Status' },
] as const

const MODAL_ID = 'results-file-upload-modal'

export function openEventFileUploadModal<R extends ImportResult>(props: Omit<FileUploadModalProps<R>, 'onClose'>) {
  modals.open({
    modalId: MODAL_ID,
    title: 'Upload Results File',
    size: 'xl',
    children: <ErrorBoundary>
      <FileUploadModal
        {...props}
        otherFields={RACE_RESULT_FIELDS}
        otherFieldSectionLabel="Race Result"
        onClose={() => modals.close(MODAL_ID)}
      />
    </ErrorBoundary>,
  })
}
