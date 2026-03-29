import { createContext, type ReactNode, useCallback, useMemo, useState } from 'react'
import type { Athlete, Organizer, Team } from '../../../shared/types'
import type { AdminUser } from '../../../shared/types/adminUsers'

const CURRENT_YEAR = new Date().getFullYear()

export type AthleteOption = {
  value: string
  label: string
  name: string
  teamName: string
  firstName: string
  lastName: string
}

export type TeamOption = {
  value: string
  label: string
}

export const AdminContext = createContext({
  years: [] as number[],
  setYears: (_: number[]) => {
  },
  organizers: new Map<string, Organizer>(),
  setOrganizers: (_: Organizer[]) => {
  },
  athletes: new Map<string, Athlete>(),
  athleteOptions: [] as AthleteOption[],
  findAthlete: (_: { firstName?: string, lastName?: string, uciId?: string }) => null as Athlete | null,
  setAthletes: (_: Map<string, Athlete>) => {
  },
  setAthleteLookupTable: (_: Map<string, string>) => {
  },
  teams: new Map<number, Team>(),
  teamOptions: {
    id: [] as TeamOption[],
    name: [] as TeamOption[],
  },
  findTeam: (_: { id?: number, name?: string }): Team | null => null,
  setTeams: (_: Map<number, Team>) => {
  },
  adminUsers: [] as AdminUser[],
  setAdminUsers: (_: AdminUser[]) => {},
  loadingStartupData: true,
  setLoadingStartupData: (_: boolean) => {
  },
})

export const AdminContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [years, setYears] = useState<number[]>([])
  const [organizers, setKeyedOrganizers] = useState<Map<string, Organizer>>(new Map<string, Organizer>())
  const [athletes, setAthletes] = useState<Map<string, Athlete>>(new Map<string, Athlete>())
  const [teams, setTeams] = useState<Map<number, Team>>(new Map<number, Team>())
  const [athleteLookupTable, setAthleteLookupTable] = useState<Map<string, string>>(new Map<string, string>())
  const [loadingStartupData, setLoadingStartupData] = useState<boolean>(true)
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([])

  const setOrganizers = useCallback(async (organizers: Organizer[]) => {
    setKeyedOrganizers(new Map(organizers.map((org) => [org.alias, org])))
  }, [setKeyedOrganizers])

  const findTeam = useCallback((o: { id?: number, name?: string }): Team | null => {
    if (o.id) return teams.get(o.id) || null
    if (o.name) {
      for (let [, team] of teams.entries()) {
        if (team.name.toLowerCase() === o.name.toLowerCase()) {
          return team
        }
      }
    }
    return null
  }, [teams])

  const findAthlete = useCallback((params: {
    firstName?: string,
    lastName?: string,
    uciId?: string
  }): Athlete | null => {
    if ('uciId' in params && params.uciId) return athletes.get(params.uciId) || null

    const uciId = athleteLookupTable.get(`${params.firstName?.toLowerCase()}|${params.lastName?.toLowerCase()}`)
    if (uciId) return athletes.get(uciId) || null

    return null
  }, [athletes, athleteLookupTable])

  const athleteOptions = useMemo((): AthleteOption[] => {
    return Array.from(athletes)
    .map(([, athlete]) => {
      const teamId = athlete.teams[CURRENT_YEAR]?.id
      const team = teamId ? teams.get(teamId) : null
      const name = `${athlete.firstName} ${athlete.lastName}`
      return {
        value: athlete.uciId,
        name,
        label: `${name}${team ? ` — ${team.name}` : ''} (${athlete.uciId})`,
        teamName: team?.name ?? '',
        firstName: athlete.firstName,
        lastName: athlete.lastName,
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name))
  }, [athletes, teams])

  const teamOptionByNames = useMemo((): TeamOption[] => {
    return Array.from(teams)
    .filter(([, team]) => !team.deleted)
    .map(([, team]) => {
      return {
        value: team.name,
        label: team.name,
      }
    })
    .sort((a, b) => a.label.localeCompare(b.label))
  }, [teams])

  const teamOptionByIds = useMemo((): TeamOption[] => {
    return Array.from(teams)
    .filter(([, team]) => !team.deleted)
    .map(([, team]) => {
      return {
        value: team.id.toString(),
        label: team.name,
      }
    })
    .sort((a, b) => a.label.localeCompare(b.label))
  }, [teams])

  const value = {
    years,
    setYears,
    organizers,
    setOrganizers,
    athletes,
    athleteOptions,
    findAthlete,
    setAthletes,
    setAthleteLookupTable,
    teams,
    teamOptions: {
      id: teamOptionByIds,
      name: teamOptionByNames,
    },
    findTeam,
    setTeams,
    adminUsers,
    setAdminUsers,
    loadingStartupData,
    setLoadingStartupData,
  }

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  )
}