import { fetchFile, type GroupedEventFile } from './aws-s3'

export async function fetchResultPayloads(filenames: string[]) {
  const payloads = await Promise.all(filenames.map(async (filename: string) => {
    const content = await fetchFile(filename)

    const PAYLOAD_START_MARKER = /\/\* !!! payload begin !!! \*\/[^{]+\{/g
    const PAYLOAD_END_MARKER = /\}\s*;\s*\/\* !!! payload end !!! \*\//g
    
    let result = PAYLOAD_START_MARKER.exec(content)
    if (result == null) throw new Error('Could not file payload start for file "' + filename + '"')
    let pStart = PAYLOAD_START_MARKER.lastIndex - 1

    result = PAYLOAD_END_MARKER.exec(content)
    if (result == null) throw new Error('Could not file payload end for file "' + filename + '"')
    let pEnd = result.index + 1

    const payloadJson = content.substring(pStart, pEnd)
    const payload = JSON.parse(payloadJson)

    return payload
  }))

  return payloads
}

export async function getEventResults(params: {
  date: string,
  organizer: string,
  eventName: string
}, allFiles: GroupedEventFile[]) {
  const eventFileGroup = allFiles.find((file: GroupedEventFile) => file.date === params.date && file.organizer === params.organizer && file.name === params.eventName)

  if (!eventFileGroup) throw new Error('No event file found!')

  const { files: filenames } = eventFileGroup

  const payloads = await fetchResultPayloads(filenames)

  console.log(payloads)
}