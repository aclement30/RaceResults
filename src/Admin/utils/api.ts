import type { Athlete } from '../../types/athletes'
import type { IngestEvent, Team } from '../../../lambdas/shared/types'
import { User } from 'oidc-client-ts'
import { COGNITO_AUTH_CONFIG, ENV } from './config'
import type { TeamRoster } from '../../types/team'

function getUser() {
  const oidcStorage = sessionStorage.getItem(`oidc.user:${COGNITO_AUTH_CONFIG.authority}:${COGNITO_AUTH_CONFIG.client_id}`)

  if (!oidcStorage) return null

  return User.fromStorageString(oidcStorage)
}

type FetchOptions = Omit<RequestInit, 'body'> & {
  body?: string | Record<string, unknown> | any[]
  apiUrl?: string
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

  try {
    const response = await fetch((options.apiUrl || VITE_API_URL) + endpoint, {
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

export const adminApi = {
  get: {
    athletes: async (): Promise<Athlete[]> => adminApiFetch('/admin/athletes'),
    athlete: async (athleteUciId: string): Promise<Athlete> => adminApiFetch(`/admin/athletes/${athleteUciId}`),
    teams: async (): Promise<Team[]> => adminApiFetch('/admin/teams'),
    teamRosters: async (): Promise<TeamRoster[]> => adminApiFetch('/admin/teams/rosters'),
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

      return adminApiFetch(`/admin/settings/config-files/${filename}`, { apiUrl })
    }
  },
  create: {
    team: async (team: Partial<Team>): Promise<Team> => {
      return adminApiFetch('/admin/teams', {
        method: 'POST',
        body: team,
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
    ): Promise<void> => adminApiFetch(`/admin/settings/config-files/${filename}`, {
      method: 'PUT',
      body: fileContent,
    })
  },
  delete: {
    team: async (teamId: number): Promise<void> => {
      await adminApiFetch(`/admin/teams/${teamId}`, { method: 'DELETE' })
    },
  },
  restore: {
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
  }
}