import { flatten } from 'lodash-es'
import { type AwsFiles, AwsS3Client } from '../../../shared/aws-s3.ts'
import type { CrossMgrEventBundle } from '../types.ts'
import { createEventSerieHash } from '../../../shared/utils.ts'

const S3_BUCKET = 'wimseyraceresults'
const AWS_REGION = 'us-west-2'

const s3 = new AwsS3Client(S3_BUCKET, {
  region: AWS_REGION,
})

// Fetch all event bundles for a given year (optionally filtered by organizer and series). Includes basic event metadata such as year, organizer, date and the results source files
export const fetchEventBundlesForYear = async (year: number, params?: {
  organizer?: string,
  serie?: string | null,
  lastModifiedSince?: Date | null
}): Promise<CrossMgrEventBundle[]> => {
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

    let parsedFiles = parseBucketFiles(filteredFiles)

    const { excludes } = parseDotFiles(files)

    if (subdirectories?.length) {
      const subdirFiles = await Promise.all(subdirectories.filter(subdirPath => !excludes?.includes(subdirPath.slice(0, -1).split('/').pop()!)).map(async (subdir) => {
        const serieAlias = subdir.slice(0, -1).split('/').pop()!

        const subdirParsedFiles = await fetchEventBundlesForYear(year, {
          organizer,
          serie: serieAlias,
          lastModifiedSince
        })

        return subdirParsedFiles.map((file) => ({
          ...file,
          serie: serieAlias
        }))
      }))

      parsedFiles = parsedFiles.concat(flatten(subdirFiles))
    }

    const shapedFiles = parsedFiles.map((file) => ({
      ...file,
      year,
      organizer,
    }))

    return shapedFiles
  }))

  const allOrganizersFiles = flatten(files) as Partial<CrossMgrEventBundle>[]

  // Consolidate event files based on date, organizer & type
  const groupedFiles = groupEventFiles(allOrganizersFiles)

  return groupedFiles
}

export const fetchCrossMgrBucketFile = (filename: string) => {
  return s3.fetchFile(filename)
}

const fetchOrganizersForYear = async (year: number): Promise<string[]> => {
  const { subdirectories } = await s3.fetchDirectoryFiles(`${year}/`)

  const organizers = subdirectories.map((subdir) => subdir.substring(5, subdir.length - 1)).sort()

  return organizers
}

const EXCLUDE_FILES = [
  'Makefile', 'index.html', 'test.html', 'list.js', 'qrcode.html',
  'md.html', 'Title.md', 'Credits.md', 'robots.txt', 'sitemap.txt', 'sitemap.xml',
  'sponsors.json', 'quotes.json'
]
const EXCLUDE_PREFIXES = ['photos-']
// const EXCLUDE_DIRECTORIES = ['javascript', 'icons', 'photos', 'css']
const EXCLUDE_EXTENSIONS = ['css', 'jpg', 'cgi', 'png', 'xml', 'pdf', 'md']

const filterFiles = (files: AwsFiles): AwsFiles => {
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

const extractEventDateFromFilename = (filename: string) => {
  const basename = filename.split('/').pop()!
  const eventName = basename.split('.').shift()!
  const eventDate = eventName.match(/^(\d{4})-(\d{2})-(\d{2})/) && eventName.substring(0, 10) || null

  return eventDate
}

const parseDotFiles = (files: AwsFiles) => {
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

const parseBucketFiles = (files: AwsFiles): Partial<CrossMgrEventBundle>[] => {
  const fileFilteringParams = parseDotFiles(files)

  const filteredFiles = filterFiles(files)

  const categorizedFiles = filteredFiles!.map((file) => {
    const filename = file.Key!
    const basename = filename!.split('/').pop()!

    const shapedFile = {
      sourceFiles: [filename],
      date: null,
    }

    if (fileFilteringParams.series?.length && fileFilteringParams.series.some(keyword => basename.includes(keyword)) || basename.toLowerCase().includes('-series')) {
      return {
        ...shapedFile,
        type: 'serie' as const,
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

export const groupEventFiles = (files: Partial<CrossMgrEventBundle>[]): CrossMgrEventBundle[] => {
  // Consolidate event files based on date, organizer & type
  const groupedFiles = files.reduce((acc, event) => {
    const eventHash = createEventSerieHash(event as CrossMgrEventBundle)

    const matchingEvent = acc.find(({ hash }) => hash === eventHash)

    if (matchingEvent) {
      matchingEvent.sourceFiles = [...new Set([...matchingEvent.sourceFiles, ...(event.sourceFiles || [])])]
    } else {
      acc.push({
        hash: eventHash,
        ...event,
      } as CrossMgrEventBundle)
    }

    return acc
  }, [] as CrossMgrEventBundle[])

  return groupedFiles
}
