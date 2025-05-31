import _ from 'lodash'
import { createEventSerieHash } from '../shared/utils.ts'
import { type AwsFiles, AwsS3Client } from '../shared/aws-s3.ts'
import type { CrossMgrEventFile } from './types.ts'

const S3_BUCKET = 'wimseyraceresults'
const AWS_REGION = 'us-west-2'

const s3 = new AwsS3Client(S3_BUCKET, {
  region: AWS_REGION,
})

export const fetchFile = (filename: string) => {
  return s3.fetchFile(filename)
}

export async function fetchResultsYears(): Promise<number[]> {
  const { subdirectories } = await s3.fetchDirectoryFiles('')

  const years = subdirectories.filter((subdir) => subdir.match(/^(19|20)\d{2}\/$/)).map((subdir) => +subdir.substring(0, 4)).sort()

  return years
}

async function fetchOrganizersForYear(year: number): Promise<string[]> {
  const { subdirectories } = await s3.fetchDirectoryFiles(`${year}/`)

  const organizers = subdirectories.map((subdir) => subdir.substring(5, subdir.length - 1)).sort()

  return organizers
}

const EXCLUDE_FILES = ['Makefile', 'index.html', 'test.html', 'list.js', 'qrcode.html',
  'md.html', 'Title.md', 'Credits.md', 'robots.txt', 'sitemap.txt', 'sitemap.xml',
  'sponsors.json', 'quotes.json']
const EXCLUDE_PREFIXES = ['photos-']
// const EXCLUDE_DIRECTORIES = ['javascript', 'icons', 'photos', 'css']
const EXCLUDE_EXTENSIONS = ['css', 'jpg', 'cgi', 'png', 'xml', 'pdf', 'md']

function filterFiles(files: AwsFiles): AwsFiles {
  return files!.filter(({ Key: filename }) => {
    const basename = filename!.split('/').pop()!
    const extension = basename.split('.').pop()!

    if (basename.startsWith('.')) return false
    if (EXCLUDE_EXTENSIONS.includes(extension)) return false
    if (EXCLUDE_FILES.includes(basename)) return false
    if (EXCLUDE_PREFIXES.some(prefix => basename.includes(prefix))) return false
    if (basename.endsWith('CoursePreview.html')) return false

    return true
  })
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

function parseFiles(files: AwsFiles): Partial<CrossMgrEventFile>[] {
  const fileFilteringParams = parseDotFiles(files)

  const filteredFiles = filterFiles(files)

  const categorizedFiles = filteredFiles!.map((file) => {
    const filename = file.Key!
    const basename = filename!.split('/').pop()!

    const shapedFile = {
      files: [filename],
      date: null,
    }

    if (fileFilteringParams.series?.length && fileFilteringParams.series.some(keyword => basename.includes(keyword)) || basename.toLowerCase().includes('-series')) {
      return {
        ...shapedFile,
        type: 'series' as const,
        lastUpdated: file.LastModified!.toISOString(),
      }
    } else if (fileFilteringParams.docs.some(keyword => basename.includes(keyword))) {
      return {
        ...shapedFile,
        type: 'doc' as const,
        name: basename.split('.').shift()?.replace(/[-_+]/g, ' ') || null,
        lastUpdated: file.LastModified!.toISOString(),
      }
    } else if (fileFilteringParams.startlists.some(keyword => basename.includes(keyword)) || basename.toLowerCase().endsWith('-startlist.html')) {
      return {
        ...shapedFile,
        type: 'startlist' as const,
        date: extractEventDateFromFilename(filename) || null,
        lastUpdated: file.LastModified!.toISOString(),
      }
    } else {
      return {
        ...shapedFile,
        type: 'event' as const,
        date: extractEventDateFromFilename(filename) || null,
        lastUpdated: file.LastModified!.toISOString(),
      }
    }
  })

  return categorizedFiles
}

export async function fetchFilesForYear(year: number, params?: {
  organizer?: string,
  serie?: string | null,
  lastModifiedSince?: Date | null
}): Promise<CrossMgrEventFile[]> {
  const { organizer, serie, lastModifiedSince } = params || {}
  let organizers = [] as string[]

  // If organizers are not provided, fetch all organizers for the given year
  if (!organizer) {
    organizers = await fetchOrganizersForYear(year)
  } else {
    organizers = [organizer]
  }

  const files = await Promise.all(organizers.map(async (organizer) => {
    if (organizer === 'testing') return []

    let basePrefix = `${year}/${organizer}/`
    if (serie) basePrefix += `${serie}/`

    const { files, subdirectories } = await s3.fetchDirectoryFiles(basePrefix)

    let filteredFiles = files
    if (lastModifiedSince) filteredFiles = filteredFiles?.filter((file) => file.LastModified! >= lastModifiedSince) || []

    let parsedFiles = parseFiles(filteredFiles)

    const { excludes } = parseDotFiles(files)

    if (subdirectories?.length) {
      const subdirFiles = await Promise.all(subdirectories.filter(subdirPath => !excludes?.includes(subdirPath.slice(0, -1).split('/').pop()!)).map(async (subdir) => {
        const serieAlias = subdir.slice(0, -1).split('/').pop()!

        const subdirParsedFiles = await fetchFilesForYear(year, { organizer, serie: serieAlias, lastModifiedSince })

        return subdirParsedFiles.map((file) => ( {
          ...file,
          series: serieAlias
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

  const allOrganizersFiles = _.flatten(files) as Partial<CrossMgrEventFile>[]

  // Consolidate event files based on date, organizer & type
  const groupedFiles = groupEventFiles(allOrganizersFiles)

  return groupedFiles
}

export const groupEventFiles = (files: Partial<CrossMgrEventFile>[]): CrossMgrEventFile[] => {
  // Consolidate event files based on date, organizer & type
  const groupedFiles = files.reduce((acc, event) => {
    const eventHash = createEventSerieHash(event as CrossMgrEventFile)

    const matchingEvent = acc.find(({ hash }) => hash === eventHash)

    if (matchingEvent) {
      matchingEvent.files = [...new Set([...matchingEvent.files, ...( event.files || [] )])]
    } else {
      acc.push({
        hash: eventHash,
        ...event,
      } as CrossMgrEventFile)
    }

    return acc
  }, [] as CrossMgrEventFile[])

  return groupedFiles
}

export async function fetchResultPayloads(filenames: string[]) {
  const payloads = await Promise.all(filenames.map(async (filename: string) => {
    const content = await s3.fetchFile(filename)

    if (!content) throw new Error(`No content found for ${filename}`)

    const PAYLOAD_START_MARKER = /\/\* !!! payload begin !!! \*\/[^{]+\{/g
    const PAYLOAD_END_MARKER = /\}\s*;\s*\/\* !!! payload end !!! \*\//g

    let result = PAYLOAD_START_MARKER.exec(content)
    if (result == null) throw new Error('Could not find payload start for file "' + filename + '"')
    let pStart = PAYLOAD_START_MARKER.lastIndex - 1

    result = PAYLOAD_END_MARKER.exec(content)
    if (result == null) throw new Error('Could not find payload end for file "' + filename + '"')
    let pEnd = result.index + 1

    const payloadJson = content.substring(pStart, pEnd)
    const payload = JSON.parse(payloadJson)

    return payload
  }))

  return payloads
}
