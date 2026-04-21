import { modals } from '@mantine/modals'
import { ErrorBoundary } from '../../../../../Shared/ErrorBoundary/ErrorBoundary'
import {
  FileUploadModal,
  type FileUploadModalProps,
  type ImportFields,
  type ImportResult
} from '../../../../Shared/FileUploadModal/FileUploadModal'

const STANDING_RESULT_FIELDS: ImportFields = [
  { key: 'finishPosition' as const, label: 'Finish Position' },
  { key: 'primes' as const, label: 'Primes' },
  { key: 'points' as const, label: 'Points' },
]

const MODAL_ID = 'serie-file-upload-modal'

export function openSerieFileUploadModal<R extends ImportResult>(props: Omit<FileUploadModalProps<R>, 'onClose'>) {
  modals.open({
    modalId: MODAL_ID,
    title: 'Upload Standings File',
    size: 'xl',
    children: <ErrorBoundary>
      <FileUploadModal
        {...props}
        otherFields={STANDING_RESULT_FIELDS}
        otherFieldSectionLabel="Standing Result"
        onClose={() => modals.close(MODAL_ID)}
      />
    </ErrorBoundary>,
  })
}