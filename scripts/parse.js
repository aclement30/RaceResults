import fetch from 'node-fetch'
import { S3Client, ListObjectsCommand } from '@aws-sdk/client-s3'
import _ from 'lodash'

const S3_BASE_PATH = 'https://wimseyraceresults.s3-us-west-2.amazonaws.com/?delimiter=/'

const S3_BUCKET = 'wimseyraceresults'

const s3Client = new S3Client({ region: 'us-west-2' })


async function fetchDirectoryFiles(directory) {
  const input = {
    Bucket: S3_BUCKET,
    Delimiter: '/',
    Prefix: directory,
  }

  const command = new ListObjectsCommand(input)
  const response = await s3Client.send(command)

  let files = []
  let subdirectories = []

  if (response.Contents) files = response.Contents
  if (response.CommonPrefixes) subdirectories = response.CommonPrefixes.map(({ Prefix }) => Prefix)

  return {
    files,
    subdirectories,
  }
}

async function fetchResultYear() {
  const { subdirectories } = await fetchDirectoryFiles( '')

  const years = subdirectories.filter((subdir) => subdir.match(/^(19|20)\d{2}\/$/)).map((subdir) => subdir.substring(0, 4)).sort()

  return years
}

async function fetchOrganizersForYear(year) {
  const { subdirectories } = await fetchDirectoryFiles( `${year}/`)

  const organizers =subdirectories.map((subdir) => subdir.substring(5, subdir.length - 1)).sort()

  return organizers
}

const EXCLUDE_FILES = ['Makefile', 'index.html','test.html','list.js', 'qrcode.html',
  'md.html', 'Title.md', 'Credits.md', 'robots.txt', 'sitemap.txt', 'sitemap.xml',
  'sponsors.json', 'quotes.json' ]
const EXCLUDE_PREFIXES = ['photos-']
const EXCLUDE_DIRECTORIES = ['javascript', 'icons', 'photos', 'css']
const EXCLUDE_EXTENSIONS = ['css', 'jpg', 'cgi', 'png', 'xml', 'pdf']

function filterFiles(files) {
  return files.filter(({ Key: filename }) => {
    const basename = filename.split('/').pop()
    const extension = basename.split('.').pop()

    if (basename.startsWith('.')) return false
    if (EXCLUDE_EXTENSIONS.includes(extension)) return false
    if (EXCLUDE_FILES.includes(basename)) return false

    return true
  })
}

function formatEventNameFromFilename(filename) {
  const basename = filename.split('/').pop()
  let eventName = basename.split('.').shift()

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

function extractEventDateFromFilename(filename) {
  const basename = filename.split('/').pop()
  let eventName = basename.split('.').shift()

  const eventDate = eventName.match(/^(\d{4})-(\d{2})-(\d{2})/) && eventName.substring(0, 10) || null

  return eventDate
}

function parseDotFiles(files) {
  const series = []
  const docs = []
  const startlists = []

  files.forEach(({ Key: filename }) => {
    const basename = filename.split('/').pop()

    // dotfilecheck(/^.*\/.COMMUNIQUE-/, item.Key, communique_include);
    // dotfilecheck(/^.*\/.PRESS-/, item.Key, press_include);
    // dotfilecheck(/^.*\/.SERIES-/, item.Key, series_include);
    // dotfilecheck(/^.*\/.START-/, item.Key, start_include);
    // dotfilecheck(/^.*\/.OTHER-/, item.Key, others_include);
    // dotfilecheck(/^.*\/.DOC-/, item.Key, docs_include);
    // dotfilecheck(/^.*\/.EXCLUDE-/, item.Key, files_exclude);
    // dotfilecheck2(/^.*\/\..*-/, item.Key, names_exclude);
    // dotfilecheck(/^.*\/.EXCLUDEDIR-/, item.Key, dirs_exclude);

    if (basename.startsWith('.SERIES-')) series.push(basename.match(/^\.SERIES-(.+)/)[1])
    if (basename.startsWith('.DOC-')) docs.push(basename.match(/^\.DOC-(.+)/)[1])
    if (basename.startsWith('.START-')) startlists.push(basename.match(/^\.START-(.+)/)[1])
  })

  return {
    series,
    docs,
    startlists,
  }
}

function parseFiles(files) {
  const fileFilteringParams = parseDotFiles(files)

  const filteredFiles = filterFiles(files)

  const categorizedFiles = filteredFiles.map((file) => {
    const { Key: filename } = file
    const basename = filename.split('/').pop()

    const shapedFile = {
      filename,
    }

    if (fileFilteringParams.series?.length && fileFilteringParams.series.some(keyword => basename.includes(keyword))) {
      return {
        ...shapedFile,
        type: 'series',
        name: basename.split('.').shift().replace(/[-_+]/g, ' ')
      }
    } else if (fileFilteringParams.docs.some(keyword => basename.includes(keyword))) {
      return {
        ...shapedFile,
        type: 'doc',
        name: basename.split('.').shift().replace(/[-_+]/g, ' ')
      }
    } else if (fileFilteringParams.startlists.some(keyword => basename.includes(keyword))) {
      return {
        ...shapedFile,
        type: 'startlist',
        name: formatEventNameFromFilename(filename),
        date: extractEventDateFromFilename(filename),
      }
    } else {
      return {
        ...shapedFile,
        type: 'event',
        name: formatEventNameFromFilename(filename),
        date: extractEventDateFromFilename(filename),
      }
    }
  })

  return categorizedFiles
}

async function fetchFilesForYear(year) {
  const organizers = await fetchOrganizersForYear(year)

  let files = await Promise.all(organizers.map(async (organizer) => {
    const basePrefix = `${year}/${organizer}/`

    const {files, subdirectories} = await fetchDirectoryFiles(basePrefix)

    let parsedFiles = parseFiles(files)

    if (subdirectories?.length) {
      const subdirFiles = await Promise.all(subdirectories.map(async (subdir) => {
        const {files} = await fetchDirectoryFiles(subdir)

        if (!files?.length) return []

        const parsedFiles = parseFiles(files)

        return parsedFiles.map((file) => ({
          ...file,
          series: subdir.slice(0, -1).split('/').pop()
        }))
      }))

      parsedFiles = parsedFiles.concat(_.flatten(subdirFiles))
    }

    const shapedFiles = parsedFiles.map((file) => ({
      ...file,
      year,
      organizer,
    }))

    return shapedFiles
  }))

  files = _.flatten(files)

  const groupedFiles = files.reduce((acc, file) => {
    const fileKey = `${file.year}/${file.organizer}/${file.type}/${file.name}/${file.date || ''}`

    const matchingFile = acc.find(({ key }) => key === fileKey)

    if (matchingFile) {
      matchingFile.files = [...matchingFile.files, file.filename]
    } else {
      acc.push({
        key: fileKey,
        ..._.omit(file, 'filename'),
        files: [file.filename],
      })
    }

    return acc
  }, [])

  return groupedFiles
}

function extractEventsFromFiles(files) {
  const events = files.filter((file) => file.type === 'event')
}

;(async () => {
  // const response = await fetch('https://api.github.com/users/github')
  // const data = await response.json()
  //
  // const fetchYears = const response = await fetch('https://api.github.com/users/github')
  // const data = await response.json()
  // console.log(data)

  const years = await fetchResultYear()
  const files = await fetchFilesForYear('2025')

  console.log(files)
})()

