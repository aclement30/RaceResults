import { User } from 'oidc-client-ts'
import queryString from 'query-string'
import type { BaseSerieEvent, CreateSerie, IngestEvent } from '../../../lambdas/shared/types'
import type {
  AdminUser,
  Athlete,
  BaseCategory,
  CreateEvent,
  CreateEventCategory,
  EventCategory,
  EventResults,
  Organizer,
  RaceEvent,
  Serie,
  SerieIndividualEventCategory,
  SerieStandings,
  Team,
  TeamRoster,
  UpdateEvent,
  UpdateSerie,
} from '../../../shared/types'

import { COGNITO_AUTH_CONFIG, ENV } from './config'

function getUser() {
  const oidcStorage = sessionStorage.getItem(`oidc.user:${COGNITO_AUTH_CONFIG.authority}:${COGNITO_AUTH_CONFIG.client_id}`)

  if (!oidcStorage) return null

  return User.fromStorageString(oidcStorage)
}

type FetchOptions = Omit<RequestInit, 'body'> & {
  body?: string | Record<string, unknown> | any[]
  apiUrl?: string
  query?: Record<string, string | number | boolean | undefined | null>
}

const { VITE_API_URL } = import.meta.env || {}

const adminApiFetch = async (endpoint: string, options: FetchOptions = {}) => {
  const user = getUser()


  if (!user) {
    throw new Error('User not authenticated!')
  }

  const { id_token: idToken } = user

  const defaultOptions: RequestInit = {
    headers: {
      'Accept': 'application/json',
      'Authorization': idToken!,
    },
    credentials: 'same-origin',
  }

  const payload = options.body && typeof options.body !== 'string' ? JSON.stringify(options.body) : options.body

  const requestOptions = { ...defaultOptions, ...options, body: payload }
  // @ts-ignore
  if (options.body) requestOptions.headers['Content-Type'] = 'application/json'

  let url = (options.apiUrl || VITE_API_URL) + endpoint
  if (options.query) url += '?' + queryString.stringify(options.query)

  try {
    const response = await fetch(url, {
      ...defaultOptions, ...options,
      body: payload
    })

    if (!response.ok) {
      let errorMessage

      if (response.status === 400) {
        const errorData = await response.json()
        errorMessage = errorData?.message || errorData?.error || JSON.stringify(errorData)
      }

      throw new Error(`API request failed: ${errorMessage || response.status + ' ' + response.statusText}`)
    }

    if (response.status === 204) return

    const data = await response.json()

    return data
  } catch (error) {
    console.error('API request error:', error)
    throw error
  }
}

const encodeS3Filename = (fileName: string) => {
  // Replace `/` with `:` to make the file name URL-safe (e.g. `settings/appConfig.json` -> `settings:appConfig.json`)
  return fileName.replace(/\//g, ':')
}

export const adminApi = {
  get: {
    athletes: async (): Promise<Athlete[]> => adminApiFetch('/admin/athletes'),
    athlete: async (athleteUciId: string): Promise<Athlete> => adminApiFetch(`/admin/athletes/${athleteUciId}`),
    athleteLookupTable: async (): Promise<Record<string, string>> => adminApiFetch('/admin/athletes/lookup-table'),
    athletesOverrides: async (): Promise<{
      alternateNames?: Record<string, string>
    }> => adminApiFetch('/admin/athletes/overrides'),
    adminUsers: async (): Promise<AdminUser[]> => adminApiFetch('/admin/users'),
    organizers: async (): Promise<Organizer[]> => adminApiFetch('/admin/organizers'),
    teams: async (): Promise<Team[]> => adminApiFetch('/admin/teams'),
    teamRosters: async (): Promise<TeamRoster[]> => adminApiFetch('/admin/teams/rosters'),
    events: async ({ year, eventHash, serieAlias }: {
      year?: number;
      eventHash?: string
      serieAlias?: string
    }): Promise<RaceEvent[]> => adminApiFetch('/admin/events', { query: { year, eventHash, serieAlias } }),
    event: async (
      year: number,
      eventHash: string
    ): Promise<RaceEvent> => adminApiFetch(`/admin/events/${year}/${eventHash}`),
    eventResults: async (
      year: number,
      eventHash: string
    ): Promise<EventResults> => adminApiFetch(`/admin/events/${year}/${eventHash}/results`),
    series: async ({ year }: {
      year?: number;
    }): Promise<Serie[]> => adminApiFetch(`/admin/series?year=${year}`),
    serie: async (
      year: number,
      serieHash: string
    ): Promise<Serie> => adminApiFetch(`/admin/series/${year}/${serieHash}`),
    serieStandings: async (year: number, serieHash: string): Promise<SerieStandings> =>
      adminApiFetch(`/admin/series/${year}/${serieHash}/standings`),
    serieEvents: async (year: number, serieHash: string, type: 'individual' | 'team'): Promise<BaseSerieEvent[]> =>
      adminApiFetch(`/admin/series/${year}/${serieHash}/${type}/events`),
    // lambdaProcessingLatestRuns: async (): Promise<{}> => adminApiFetch('/admin/lambdas/processing/latest-runs'),
    settingConfigFile: async (filename: string, env?: 'stage' | 'production'): Promise<any> => {
      let apiUrl: string = VITE_API_URL

      if (env && env !== ENV) {
        if (env === 'production') {
          apiUrl = VITE_API_URL.replace('/api/stage', '/api')
        } else {
          apiUrl = VITE_API_URL.replace('/api', '/api/stage')
        }
      }

      return adminApiFetch(`/admin/settings/config-files/${encodeS3Filename(filename)}`, { apiUrl })
    }
  },
  create: {
    event: async (event: CreateEvent): Promise<RaceEvent> => {
      return adminApiFetch(`/admin/events`, {
        method: 'POST',
        body: event,
      })
    },
    eventResultCategory: async (
      category: BaseCategory,
      { year, eventHash }: { year: number, eventHash: string }
    ): Promise<EventCategory> => {
      return adminApiFetch(`/admin/events/${year}/${eventHash}/results/category`, {
        method: 'POST',
        body: category,
      })
    },
    team: async (team: Partial<Team>): Promise<Team> => {
      return adminApiFetch('/admin/teams', {
        method: 'POST',
        body: team,
      })
    },
    serie: async (serie: CreateSerie): Promise<Serie> => {
      return adminApiFetch(`/admin/series`, {
        method: 'POST',
        body: serie,
      })
    },
    serieStandingEvent: async (
      year: number,
      serieHash: string,
      date: string,
    ): Promise<BaseSerieEvent> => {
      return adminApiFetch(`/admin/series/${year}/${serieHash}/standings/individual`, {
        method: 'POST',
        body: { date },
      })
    },
  },
  update: {
    athlete: async (athlete: Partial<Athlete> & { uciId: string }): Promise<void> => {
      await adminApiFetch(`/admin/athletes/${athlete.uciId}`, {
        method: 'PUT',
        body: athlete,
      })
    },
    serie: async (year: number, serieHash: string, serie: UpdateSerie): Promise<Serie> => {
      return adminApiFetch(`/admin/series/${year}/${serieHash}`, {
        method: 'PUT',
        body: serie,
      })
    },
    serieLock: async (year: number, serieHash: string, locked: boolean): Promise<void> => {
      await adminApiFetch(`/admin/series/${year}/${serieHash}/${locked ? 'lock' : 'unlock'}`, {
        method: 'PATCH',
      })
    },
    event: async (eventHash: string, event: UpdateEvent & { date: string }): Promise<RaceEvent> => {
      const year = +event.date.slice(0, 4)
      return adminApiFetch(`/admin/events/${year}/${eventHash}`, {
        method: 'PUT',
        body: { ...event, hash: eventHash },
      })
    },
    eventLock: async (eventHash: string, year: number, locked: boolean): Promise<void> => {
      await adminApiFetch(`/admin/events/${year}/${eventHash}/${locked ? 'lock' : 'unlock'}`, {
        method: 'PATCH',
      })
    },
    eventPublished: async (eventHash: string, year: number, published: boolean): Promise<void> => {
      await adminApiFetch(`/admin/events/${year}/${eventHash}/${published ? 'publish' : 'unpublish'}`, {
        method: 'PATCH',
      })
    },
    eventResultCategory: async (
      category: CreateEventCategory,
      { year, eventHash }: { year: number, eventHash: string }
    ): Promise<EventCategory> => {
      return adminApiFetch(`/admin/events/${year}/${eventHash}/results/category/${category.alias}`, {
        method: 'PATCH',
        body: category,
      })
    },
    eventResultCategoryLock: async (
      categoryAlias: string,
      locked: boolean,
      { year, eventHash }: { year: number, eventHash: string }
    ): Promise<void> => {
      await adminApiFetch(`/admin/events/${year}/${eventHash}/results/category/${categoryAlias}/${locked ? 'lock' : 'unlock'}`, {
        method: 'PATCH',
      })
    },
    eventResultCategoriesOrder: async (
      aliases: string[],
      { year, eventHash }: { year: number, eventHash: string }
    ): Promise<void> => {
      await adminApiFetch(`/admin/events/${year}/${eventHash}/results/categories/order`, {
        method: 'PATCH',
        body: { aliases },
      })
    },
    serieStandingCategories: async (
      year: number,
      serieHash: string,
      categories: BaseCategory[]
    ): Promise<BaseCategory[]> => {
      return adminApiFetch(`/admin/series/${year}/${serieHash}/standings/categories`, {
        method: 'PUT',
        body: categories,
      })
    },
    serieStandingEventPublished: async (
      published: boolean,
      { year, serieHash, date }: { year: number, serieHash: string, date: string }
    ): Promise<void> => {
      await adminApiFetch(`/admin/series/${year}/${serieHash}/standings/individual/${date}/${published ? 'publish' : 'unpublish'}`, {
        method: 'PATCH',
      })
    },
    serieStandingEventCategory: async (
      category: SerieIndividualEventCategory,
      {
        year,
        serieHash,
        date,
        categoryAlias
      }: {
        year: number,
        serieHash: string,
        date: string,
        categoryAlias: string
      }
    ): Promise<SerieIndividualEventCategory> => {
      return adminApiFetch(`/admin/series/${year}/${serieHash}/standings/individual/${date}/category/${categoryAlias}`, {
        method: 'PATCH',
        body: category,
      })
    },
    serieStandingEventCategoryLock: async (
      locked: boolean,
      { year, serieHash, date, categoryAlias }: { year: number, serieHash: string, date: string, categoryAlias: string }
    ): Promise<void> => {
      await adminApiFetch(`/admin/series/${year}/${serieHash}/standings/individual/${date}/category/${categoryAlias}/${locked ? 'lock' : 'unlock'}`, {
        method: 'PATCH',
      })
    },
    team: async (team: Partial<Team> & { id: number }): Promise<void> => {
      await adminApiFetch(`/admin/teams/${team.id}`, {
        method: 'PUT',
        body: team,
      })
    },
    teamRoster: async (teamId: number, athleteUciIds: string[]): Promise<void> => {
      const bodyPayload: { athletes: { athleteUciId: string }[] } = {
        athletes: athleteUciIds.map(athleteUciId => ({
          athleteUciId,
        }))
      }

      await adminApiFetch(`/admin/teams/${teamId}/roster`, {
        method: 'PUT',
        body: bodyPayload,
      })
    },
    settingConfigFile: async (
      filename: string,
      fileContent: any
    ): Promise<void> => adminApiFetch(`/admin/settings/config-files/${encodeS3Filename(filename)}`, {
      method: 'PUT',
      body: fileContent,
    }),
  },
  delete: {
    event: async (year: number, eventHash: string): Promise<void> => {
      await adminApiFetch(`/admin/events/${year}/${eventHash}`, { method: 'DELETE' })
    },
    eventResultCategory: async (
      categoryAlias: string,
      { year, eventHash }: { year: number, eventHash: string }
    ): Promise<EventCategory> => {
      return adminApiFetch(`/admin/events/${year}/${eventHash}/results/category/${categoryAlias}`, {
        method: 'DELETE',
      })
    },
    serieStandingEvent: async (year: number, serieHash: string, date: string): Promise<void> => {
      await adminApiFetch(`/admin/series/${year}/${serieHash}/standings/individual/${date}`, { method: 'DELETE' })
    },
    team: async (teamId: number): Promise<void> => {
      await adminApiFetch(`/admin/teams/${teamId}`, { method: 'DELETE' })
    },
  },
  restore: {
    // eventResultCategory: async (
    //   categoryAlias: string,
    //   { year, eventHash }: { year: number, eventHash: string }
    // ): Promise<EventCategory> => {
    //   return adminApiFetch(`/admin/events/${year}/${eventHash}/results/category/${categoryAlias}/restore`, {
    //     method: 'PATCH',
    //   })
    // },
    team: async (teamId: number): Promise<void> => {
      await adminApiFetch(`/admin/teams/${teamId}/restore`, { method: 'PATCH' })
    },
  },
  run: {
    athleteProcessor: async (options: {
      runType: 'all-events' | 'event' | 'athletes',
      year: number,
      eventHash?: string,
      athleteUciIds?: string[]
    }): Promise<{ durationMs: number, allUpdatedAthleteIds: string[] }> => {
      return adminApiFetch(`/lambdas/processing?runType=${options.runType}&year=${options.year}&eventHash=${options.eventHash || ''}&athleteUciIds=${options.athleteUciIds?.join(',') || ''}`, { method: 'POST' })
    },
    resultProcessor: async (options: {
      runType: 'all-events' | 'event',
      year: number,
      eventHash?: string,
      providers?: string[]
    }): Promise<{ durationMs: number, providers: Record<string, IngestEvent> }> => {
      return adminApiFetch(`/lambdas/ingest?runType=${options.runType}&year=${options.year}&eventHash=${options.eventHash || ''}&providers=${options.providers?.join(',') || ''}`, { method: 'POST' })
    }
  },
}