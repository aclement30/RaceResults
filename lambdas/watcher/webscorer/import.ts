import makeFetchCookie from 'fetch-cookie'
import * as cheerio from 'cheerio'
import { PROVIDER_NAME, RAW_DATA_PATH, SOURCE_URL_PREFIX } from './config.ts'
import type { WebscorerEvent } from './types.ts'
import { createEventSerieHash, getLastCheckDate, s3 as RRS3, setLastCheck } from '../../shared/utils.ts'
import defaultLogger from '../../shared/logger.ts'

const logger = defaultLogger.child({ provider: PROVIDER_NAME })
const currentYear = new Date().getFullYear()

export default async ({ year: requestedYear }: { year?: number } = {}) => {
  const { year, ...sourceBundles } = await getEventResultsList(requestedYear)

  logger.info(`${sourceBundles.events?.length || 0} updated events`)
  // logger.info(`${sourceBundles.series?.length || 0} updated series`)

  const importedRawData = await Promise.allSettled([
    ...sourceBundles.events,
    // ...sourceBundles.series
  ].map(async (bundle) => {
    let payload: string = ''
    let lastUpdated: string | undefined = undefined

    if (bundle.type === 'event') {
      ({ payload, lastUpdated } = await fetchEventRawData(bundle.sourceUrl))
    } else if (bundle.type === 'serie') {
      throw new Error('Fetching series data is not supported yet')
      // ({ payload, lastUpdated } = await fetchSerieRawData(bundle.sourceUrl))
    } else {
      throw new Error(`Unsupported bundle type: ${bundle.type}`)
    }

    return {
      ...bundle,
      lastUpdated,
      payload,
    }
  }))

  // Fetch only updated files since last check date
  const lastCheckDate = await getLastCheckDate(RAW_DATA_PATH)

  const importedHashes: string[] = []

  // Write raw data to S3 bucket
  for (const importResult of importedRawData) {
    if (importResult.status === 'rejected') {
      logger.error(`Failed to import raw data: ${importResult.reason}`, { error: importResult.reason })
      continue
    }

    const { payload, ...bundle } = importResult.value
    const { hash, year, lastUpdated } = bundle

    // Only import if that year was requested or if the last updated date is after the last check date
    if (requestedYear || !lastCheckDate || (lastUpdated && new Date(lastUpdated) >= lastCheckDate)) {
      importedHashes.push(hash)
      logger.info(`Importing raw data for ${bundle.type} ${year}/${bundle.hash}`)

      const filePath = `${RAW_DATA_PATH}${year}/${hash}.json`

      try {
        logger.info(`Uploading ${bundle.hash} raw data to ${filePath}`)
        await RRS3.writeFile(filePath, JSON.stringify(importResult.value))
      } catch (err) {
        logger.error(`Failed to upload raw data for ${bundle.type} "${bundle.hash}": ${(err as any).message}`, {
          error: err,
          hash: bundle.hash
        })
      }
    }
  }

  await setLastCheck(PROVIDER_NAME, new Date(), { events: importedHashes.length })

  return { year, hashes: importedHashes }
}

const getEventResultsList = async (year: number = currentYear) => {
  let events = await fetchEventsForYear(year)

  return {
    year,
    events: events.filter(event => event.type === 'event'),
  }
}

const fetchEventsForYear = async (year: number) => {
  const fetchWithCookies = makeFetchCookie(fetch)

  logger.info(`Fetching events list from Webscorer for ${year}`)

  const getResponse = await fetchWithCookies('https://www.webscorer.com/findraces?pg=resultnoseries')

  // Retrieve hidden form data from the initial GET request
  let formData = await getResponse.text().then((html) => extractFormData(html))

  // Update form data with specific values for the year and other parameters
  formData = {
    ...formData,
    ctl00$CPH1$Hidden_MapBounds: '{"HasBounds":true,"Latitude_Begin":46.95825493620968,"Latitude":50.436976626623945,"Latitude_End":53.67761662899887,"Longitude_Begin":-133.67749419651912,"Longitude":-122.9108926340191,"Longitude_End":-112.1442910715191,"Zoom":6}',
    ctl00$CPH1$ctrlSearchFilter$ddStartMonth: '01',
    ctl00$CPH1$ctrlSearchFilter$ddStartDay: '01',
    ctl00$CPH1$ctrlSearchFilter$ddStartYear: year.toString(),
    ctl00$CPH1$ctrlSearchFilter$ddEndMonth: '12',
    ctl00$CPH1$ctrlSearchFilter$ddEndDay: '31',
    ctl00$CPH1$ctrlSearchFilter$ddEndYear: year.toString(),
    ctl00$CPH1$ctrlSearchFilter$SportCheckList$SportCheckList_12: '6',
    ctl00$CPH1$ctrlSearchFilter$sfltDdSearchBy: 'FEAT',
    __ASYNCPOST: 'true',
  }

  const body = new URLSearchParams(formData)

  const postResponse = await fetchWithCookies('https://www.webscorer.com/findraces?pg=resultnoseries', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:139.0) Gecko/20100101 Firefox/139.0',
    },
    body: body.toString(),
  })

  if (postResponse.status !== 200) {
    throw new Error(`Failed to fetch event results for year ${year}: ${postResponse.status} ${postResponse.statusText}`)
  }

  const events = await postResponse.text().then(html => extractEventsList(html))

  return events
}

const extractFormData = (html: string): Record<string, string> => {
  const formData: Record<string, string> = {}

  const $ = cheerio.load(html)

  const form = $('form[action="./findraces?pg=resultnoseries"]')
  form.find('input[type="hidden"]').each((_, input) => {
    const name = $(input).attr('name')
    const value = $(input).attr('value') || ''
    if (name) {
      formData[name] = value
    }
  })

  return formData
}

const extractEventsList = (html: string): WebscorerEvent[] => {
  const $ = cheerio.load(html)

  const racesTable = $('table[id="liveRaceTable"]')

  const events: WebscorerEvent[] = []

  racesTable.find('tbody tr').toArray().forEach((row) => {
    let raceName = '', raceDate = '', raceLocation = { city: '', province: '', country: 'CA' }, raceUrl = ''

    $(row).find('td').toArray().forEach((cell, idx) => {
      if (idx === 1) {
        const link = $(cell).find('a')
        raceUrl = link.attr('href') || ''
        raceName = link.text().trim()
      } else if (idx === 2) {
        const dateText = $(cell).text().trim()
        const date = new Date(dateText)
        raceDate = date.toISOString().split('T')[0] // Format as YYYY-MM-DD
      } else if (idx === 3) {
        let city = null
        let province = null

        const cityProvince = $(cell).find('.cityStateSpan').text()
        if (cityProvince.includes(', ')) {
          [city, province] = cityProvince.split(', ')
        } else {
          city = cityProvince
        }

        const country = $(cell).html()!.split('<br>')[1].trim() // Get the first line of the location

        raceLocation = {
          city: city || '',
          province: province || '',
          country: country?.toUpperCase().slice(0, 2),
        }
      }
    })

    const year = +raceDate.slice(0, 4)
    const organizer = extractOrganizerFromName(raceName, raceLocation.city)

    if (!isEventIgnored(year, organizer, raceName, raceLocation)) {
      events.push({
        hash: createEventSerieHash({ year, type: 'event', organizer, name: raceName, date: raceDate }),
        type: 'event',
        year,
        date: raceDate,
        name: formatName(raceName),
        organizer,
        serie: getSerie(organizer, raceName),
        // @ts-ignore
        location: raceLocation,
        sourceUrl: `${SOURCE_URL_PREFIX}${raceUrl}`,
      })
    }
  })

  return events
}

const extractOrganizerFromName = (name: string, city: string): string => {
  if (name.includes('VCL')) {
    return 'VictoriaCycling'
  } else if (name.includes('Coastal Edge')) {
    return 'CoastalEdge'
  } else if (city === 'Victoria') {
    return 'VictoriaCycling'
  } else {
    throw new Error(`Unknown organizer for event ${name}!`)
  }
}

const fetchEventRawData = async (sourceUrl: string) => {
  const getResponse = await fetch(sourceUrl.replace('/race?', '/racealldetails?'))

  const html = await getResponse.text()

  if (!html) throw new Error(`No content found for ${sourceUrl}`)

  const $ = cheerio.load(html)

  // Extract last updated date
  const lastUpdatedText = $('.race-info-summary-wrapper table td:contains(Updated)').next().text().trim()
  const lastUpdatedDate = lastUpdatedText ? new Date(lastUpdatedText).toISOString() : undefined

  return {
    payload: html,
    lastUpdated: lastUpdatedDate,
  }
}

const formatName = (name: string): string => {
  if (name.includes('2025 VCL')) {
    // Remove 'Results' from the name
    name = name.replace('Results', '')
    // Remove race number: 2025 VCL #1 North Saanich -> 2025 VCL North Saanich
    name = name.replace(/^(\d{4}\sVCL\s#\d)\s-?/, '')
    name = name.replace(/^\d{4}\sVCL\s/, '')
    if (name.includes('Windsor Park') && !name.includes('Crit')) name += ' Crit'
    name = name.trim()
  }

  return name
}

const isEventIgnored = (
  year: number,
  organizer: string,
  name: string,
  location: { province: string, country: string }
): boolean => {
  // Only include races in British Columbia, Canada
  if (location.country.toUpperCase() !== 'CA' || location.province.toUpperCase() !== 'BC') return true

  if (year === 2025 && organizer === 'VictoriaCycling') {
    const ignoredEvents = [
      '2025 VCL Windsor Park Crit May 11th A & B Men',
      '2025 VCL Windsor Park Crit May 11th C/D & B Women'
    ]

    return ignoredEvents.includes(name)
  }

  return false
}

const getSerie = (organizer: string, eventName: string): string | undefined => {
  if (organizer === 'VictoriaCycling' && eventName.includes('2025 VCL')) return 'VCL2025'

  return undefined
}