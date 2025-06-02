import { AwsS3Client, RR_S3_BUCKET } from '../shared/aws-s3.ts'
import type { ManualImportBaseFile, ManualImportEventFile, ManualImportSerieFile } from './types.ts'
import { createEventSerieHash } from '../shared/utils.ts'
import defaultLogger from '../shared/logger.ts'
import { validateRefFile } from './utils.ts'

const s3 = new AwsS3Client(RR_S3_BUCKET)

const logger = defaultLogger.child({ provider: 'manual-import' })

export const fetchFile = (filename: string) => {
  return s3.fetchFile(filename)
}

export const fetchDirectoryFiles = (directory: string) => {
  return s3.fetchDirectoryFiles(directory)
}

export const fetchManualImportFiles = async (): Promise<{
  event: ManualImportEventFile[],
  series: ManualImportSerieFile[]
}> => {
  const { files, subdirectories } = await fetchDirectoryFiles('manual-import/')

  const importManualFiles = await Promise.allSettled(subdirectories.map(async (subdir): Promise<ManualImportBaseFile> => {
    const subdirName = subdir.slice(0, -1).split('/').pop()!

    logger.info(`Analyzing manual import files for: ${subdir}`)

    const { files: subdirFiles } = await fetchDirectoryFiles(subdir)
    const sourceFiles = subdirFiles?.map(file => file.Key!) || []

    const referenceFile = files?.find(f => f.Key === 'manual-import/' + subdirName + '.json')

    if (!referenceFile) throw new Error(`Could not find manual import file for '${subdirName}'!`)

    const refFileContent: ManualImportBaseFile = await fetchFile(referenceFile.Key!).then(content => JSON.parse(content!))

    validateRefFile(refFileContent)

    return {
      ...refFileContent,
      hash: createEventSerieHash(refFileContent as ManualImportSerieFile),
      files: sourceFiles,
    }
  }))

  const importFiles: { event: ManualImportEventFile[], series: ManualImportSerieFile[] } = {
    event: [],
    series: []
  }

  importManualFiles.forEach((parseResult) => {
    if (parseResult.status === 'fulfilled') {
      if (parseResult.value.type === 'event') {
        importFiles.event.push(parseResult.value as ManualImportEventFile)
      } else if (parseResult.value.type === 'series') {
        importFiles.series.push(parseResult.value as ManualImportSerieFile)
      }
    } else {
      logger.error(parseResult.reason)
    }
  })

  return importFiles
}