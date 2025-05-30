import { AwsS3Client, RR_S3_BUCKET } from '../shared/aws-s3.ts'
import type { ManualImportEventSerieFile } from './types.ts'
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
  event: ManualImportEventSerieFile[],
  series: ManualImportEventSerieFile[]
}> => {
  const { files, subdirectories } = await fetchDirectoryFiles('manual-import/')

  const importSerieFiles = await Promise.allSettled(subdirectories.map(async (subdir): Promise<ManualImportEventSerieFile> => {
    const subdirName = subdir.slice(0, -1).split('/').pop()!

    logger.info(`Analyzing manual import files for ${subdirName}...`)

    const { files: subdirFiles } = await fetchDirectoryFiles(subdir)
    const sourceFiles = subdirFiles.map(file => file.Key)

    const referenceFile = files.find(f => f.Key === 'manual-import/' + subdirName + '.json')

    if (!referenceFile) throw new Error(`Could not find manual import file for '${subdirName}'!`)

    const refFileContent = await fetchFile(referenceFile.Key).then(content => JSON.parse(content))

    validateRefFile(refFileContent)

    return {
      ...refFileContent,
      hash: createEventSerieHash(refFileContent as ManualImportEventSerieFile),
      files: sourceFiles,
    }
  }))

  const importFiles: { event: ManualImportEventSerieFile[], series: ManualImportEventSerieFile[] } = {
    event: [],
    series: []
  }

  importSerieFiles.forEach((parseResult) => {
    if (parseResult.status === 'fulfilled') {
      if (parseResult.value.type === 'event') {
        importFiles.event.push(parseResult.value)
      } else if (parseResult.value.type === 'series') {
        importFiles.series.push(parseResult.value)
      }
    } else {
      logger.error(parseResult.reason)
    }
  })

  return importFiles
}