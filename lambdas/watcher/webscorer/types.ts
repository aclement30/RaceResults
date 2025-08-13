export type WebscorerEvent = {
  hash: string
  type: 'event' | 'serie'
  year: number
  date: string
  name: string
  organizer: string
  serie?: string
  location: {
    city: string
    province: string
    country: 'CA' | 'US'
  }
  sourceUrl: string
  lastUpdated?: string
}

export type WebscorerEventRawData = WebscorerEvent & {
  type: 'event',
  payload: string
}