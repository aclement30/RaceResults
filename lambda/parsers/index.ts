import { refreshYear as CrossMgrParser } from './cross-mgr/index.ts'
import { main as ManualImportParser } from './manual-import/index.ts'

( async () => {
  await CrossMgrParser()
  await ManualImportParser()
} )()