import { createContext } from 'react'
import type { RaceEvent } from './utils/loadStartupData'
import type { GroupedEventFile } from './utils/aws-s3'

export const AppContext = createContext({
  years: [] as number[],
  events: [] as RaceEvent[],
  files: [] as GroupedEventFile[],
  loading: true,
})
