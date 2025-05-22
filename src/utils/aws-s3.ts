import { S3Client, ListObjectsCommand, type ListObjectsCommandOutput, GetObjectCommand } from '@aws-sdk/client-s3'
import { fromCognitoIdentityPool } from '@aws-sdk/credential-providers'
import _ from 'lodash'
import shortHash from 'short-hash'
import type { BaseEvent } from './loadStartupData'
import type { CrossMgrEventSourceFiles } from '../types/CrossMgr'

const S3_BUCKET = 'wimseyraceresults'
const AWS_REGION = 'us-west-2'
const AWS_POOL_ID = 'us-west-2:d4056c4b-05d2-4f3f-930c-ba3e95cb2153'

const s3Client = new S3Client({
  region: AWS_REGION, credentials: fromCognitoIdentityPool({
    clientConfig: { region: AWS_REGION },
    identityPoolId: AWS_POOL_ID,
  }),
})

type AwsFiles = Required<ListObjectsCommandOutput['Contents']>

export async function fetchDirectoryFiles(directory: string): Promise<{ files: AwsFiles, subdirectories: string[] }> {
  const response = await s3Client.send(
    new ListObjectsCommand({
      Bucket: S3_BUCKET,
      Delimiter: '/',
      Prefix: directory,
    })
  )

  let files: AwsFiles = []
  let subdirectories: string[] = []

  if (response.Contents?.length) files = response.Contents
  if (response.CommonPrefixes) subdirectories = response.CommonPrefixes.map(({ Prefix }) => Prefix!)

  return {
    files,
    subdirectories,
  }
}

export async function fetchFile(filename: string): Promise<string> {
  const response = await s3Client.send(
    new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: filename,
    }),
  )

  // The Body object also has 'transformToByteArray' and 'transformToWebStream' methods.
  const content = await response.Body.transformToString()

  return content
}

export async function fetchResultsYears(): Promise<number[]> {
  const { subdirectories } = await fetchDirectoryFiles('')

  const years = subdirectories.filter((subdir) => subdir.match(/^(19|20)\d{2}\/$/)).map((subdir) => +subdir.substring(0, 4)).sort()

  return years
}

async function fetchOrganizersForYear(year: number): Promise<string[]> {
  const { subdirectories } = await fetchDirectoryFiles(`${year}/`)

  const organizers = subdirectories.map((subdir) => subdir.substring(5, subdir.length - 1)).sort()

  return organizers
}

const EXCLUDE_FILES = ['Makefile', 'index.html', 'test.html', 'list.js', 'qrcode.html',
  'md.html', 'Title.md', 'Credits.md', 'robots.txt', 'sitemap.txt', 'sitemap.xml',
  'sponsors.json', 'quotes.json']
// const EXCLUDE_PREFIXES = ['photos-']
// const EXCLUDE_DIRECTORIES = ['javascript', 'icons', 'photos', 'css']
const EXCLUDE_EXTENSIONS = ['css', 'jpg', 'cgi', 'png', 'xml', 'pdf']

function filterFiles(files: AwsFiles): AwsFiles {
  return files!.filter(({ Key: filename }) => {
    const basename = filename!.split('/').pop()!
    const extension = basename.split('.').pop()!

    if (basename.startsWith('.')) return false
    if (EXCLUDE_EXTENSIONS.includes(extension)) return false
    if (EXCLUDE_FILES.includes(basename)) return false

    return true
  })
}

function formatEventNameFromFilename(filename: string) {
  const basename = filename.split('/').pop()!
  let eventName = basename.split('.').shift()!

  /* Don't display annoying CrossMgr -r1-. labels at the end of file names,
   * only the display name is modified. The file name is left so that the aref
   * will work correctly.
   */
  eventName = eventName.replace(/r\d-/, '')
  eventName = eventName.replace(/-[^-]*$/, '')

  /* if the name ends in whitespace and a number, remove, eg. WTNC UBC 730
   */
  eventName = eventName.replace(/[ -]\d+$/, '')

  eventName = eventName.replace(/[-_+]/g, ' ')

  // Remove date & hour from event name
  eventName = eventName.replace(/^(\d{4})\s(\d{2})\s(\d{2})/, '')
  eventName = eventName.replace(/([0-1]?[0-9]|2[0-3])[0-5][0-9]\s?(AM|PM)?$/, '')

  eventName = eventName.trim()

  return eventName
}

function extractEventDateFromFilename(filename: string) {
  const basename = filename.split('/').pop()!
  let eventName = basename.split('.').shift()!

  const eventDate = eventName.match(/^(\d{4})-(\d{2})-(\d{2})/) && eventName.substring(0, 10) || null

  return eventDate
}

function parseDotFiles(files: AwsFiles) {
  const series: string[] = []
  const docs: string[] = []
  const startlists: string[] = []
  const excludes: string[] = []

  files!.forEach(({ Key: filename }) => {
    const basename = filename!.split('/').pop()!

    // dotfilecheck(/^.*\/.COMMUNIQUE-/, item.Key, communique_include);
    // dotfilecheck(/^.*\/.PRESS-/, item.Key, press_include);
    // dotfilecheck(/^.*\/.SERIES-/, item.Key, series_include);
    // dotfilecheck(/^.*\/.START-/, item.Key, start_include);
    // dotfilecheck(/^.*\/.OTHER-/, item.Key, others_include);
    // dotfilecheck(/^.*\/.DOC-/, item.Key, docs_include);
    // dotfilecheck(/^.*\/.EXCLUDE-/, item.Key, files_exclude);
    // dotfilecheck2(/^.*\/\..*-/, item.Key, names_exclude);
    // dotfilecheck(/^.*\/.EXCLUDEDIR-/, item.Key, dirs_exclude);

    if (basename.startsWith('.SERIES-')) series.push(basename.match(/^\.SERIES-(.+)/)![1])
    if (basename.startsWith('.DOC-')) docs.push(basename.match(/^\.DOC-(.+)/)![1])
    if (basename.startsWith('.START-')) startlists.push(basename.match(/^\.START-(.+)/)![1])
    if (basename.startsWith('.EXCLUDEDIR-')) excludes.push(basename.match(/^\.EXCLUDEDIR-(.+)/)![1])
  })


  return {
    series,
    docs,
    startlists,
    excludes,
  }
}

export type EventFile = {
  key: string
  hash: string
  filename: string
  type: 'event' | 'series' | 'doc' | 'startlist'
  name: string | null
  date: string | null
  year: number
  organizer: string
  series?: string | null
}

export type GroupedEventFile = Omit<EventFile, 'filename'> & { files: string[] }

function parseFiles(files: AwsFiles): Partial<EventFile>[] {
  const fileFilteringParams = parseDotFiles(files)

  const filteredFiles = filterFiles(files)

  const categorizedFiles = filteredFiles!.map((file) => {
    const filename = file.Key!
    const basename = filename!.split('/').pop()!

    const shapedFile = {
      filename,
      date: null,
    }

    if (fileFilteringParams.series?.length && fileFilteringParams.series.some(keyword => basename.includes(keyword)) || basename.includes('-series')) {
      return {
        ...shapedFile,
        type: 'series' as const,
        name: basename.split('.').shift()?.replace(/[-_+]/g, ' ') || null
      }
    } else if (fileFilteringParams.docs.some(keyword => basename.includes(keyword))) {
      return {
        ...shapedFile,
        type: 'doc' as const,
        name: basename.split('.').shift()?.replace(/[-_+]/g, ' ') || null
      }
    } else if (fileFilteringParams.startlists.some(keyword => basename.includes(keyword)) || basename.endsWith('-startlist.html')) {
      return {
        ...shapedFile,
        type: 'startlist' as const,
        name: formatEventNameFromFilename(filename) || null,
        date: extractEventDateFromFilename(filename) || null,
      }
    } else {
      return {
        ...shapedFile,
        type: 'event' as const,
        name: formatEventNameFromFilename(filename) || null,
        date: extractEventDateFromFilename(filename) || null,
      }
    }
  })

  return categorizedFiles
}

export async function fetchFilesForYear(year: number): Promise<GroupedEventFile[]> {
  const organizers = await fetchOrganizersForYear(year)

  const files = await Promise.all(organizers.map(async (organizer) => {
    const basePrefix = `${year}/${organizer}/`

    const { files, subdirectories } = await fetchDirectoryFiles(basePrefix)

    if (organizer === 'Concord2024') console.log(files, subdirectories)

    let parsedFiles = parseFiles(files)

    const { excludes } = parseDotFiles(files)

    if (subdirectories?.length) {
      const subdirFiles = await Promise.all(subdirectories.map(async (subdir) => {
        const subdirName = subdir.slice(0, -1).split('/').pop()!

        if (excludes?.includes(subdirName)) return []

        const { files } = await fetchDirectoryFiles(subdir)

        if (!files?.length) return []

        const parsedFiles = parseFiles(files)

        return parsedFiles.map((file) => ( {
          ...file,
          series: subdirName
        } ))
      }))

      parsedFiles = parsedFiles.concat(_.flatten(subdirFiles))
    }

    const shapedFiles = parsedFiles.map((file) => ( {
      ...file,
      year,
      organizer,
    } ))

    return shapedFiles
  }))

  const allOrganizerFiles = _.flatten(files) as Partial<EventFile>[]

  const groupedFiles = allOrganizerFiles.reduce((acc, file) => {
    const fileKey = `${file.year}/${file.organizer}/${file.type}/${file.date || ''}`

    const matchingFile = acc.find(({ key }) => key === fileKey)

    if (matchingFile) {
      matchingFile.files = [...matchingFile.files!, file.filename!]
    } else {
      acc.push({
        key: fileKey,
        hash: shortHash(fileKey),
        ..._.omit(file, 'filename'),
        files: [file.filename!],
      } as GroupedEventFile)
    }

    return acc
  }, [] as GroupedEventFile[])

  return groupedFiles
}

export async function fetchCrossMgrEventsAndSeriesForYear(year: number) {
  const files = await fetchFilesForYear(year)

  const events: BaseEvent[] = files
    .filter((file) => file.type === 'event')
    .map((file) => ( {
      hash: file.hash,
      year: file.year,
      date: file.date,
      organizer: file.organizer,
      name: file.name,
      series: file.series,
    } ))

  const series = files.filter((file) => file.type === 'series').map((file) => ( {
    hash: file.hash,
    year: file.year,
    date: file.date,
    organizer: file.organizer,
    name: file.name,
  } ))

  const sourceFiles: CrossMgrEventSourceFiles = files.reduce((acc, file) => {
    acc[file.hash] = file.files
    return acc
  }, {} as CrossMgrEventSourceFiles)

  return {
    events,
    series,
    sourceFiles,
  }
}

export async function fetchEventsAndSeriesForYear(year: number) {
  const { events, series, sourceFiles } = await fetchCrossMgrEventsAndSeriesForYear(year)

  return {
    events,
    series,
    sourceFiles,
  }
}