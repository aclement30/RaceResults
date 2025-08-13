import { createContext, type ReactNode, useCallback, useState } from 'react'
import type { EventSummary, SerieSummary } from './types/results'
import type { Athlete } from './types/athletes'
import type { Team } from './types/team'

export const AppContext = createContext({
  years: [] as number[],
  setYears: (_: number[]) => {
  },
  events: new Map<number, EventSummary[]>(),
  setEvents: (_: EventSummary[], __: number) => {
  },
  series: new Map<number, SerieSummary[]>(),
  setSeries: (_: SerieSummary[], __: number) => {
  },
  athletes: new Map<string, Athlete>(),
  findAthlete: (_: { firstName?: string, lastName?: string, uciId?: string }) => null as Athlete | null,
  setAthletes: (_: Map<string, Athlete>) => {
  },
  setAthleteLookupTable: (_: Map<string, string>) => {
  },
  teams: new Map<number, Team>(),
  findTeam: (_: { id?: number, name?: string }): Team | null => null,
  setTeams: (_: Map<number, Team>) => {
  },
  loadingStartupData: true,
  setLoadingStartupData: (_: boolean) => {
  },
})

export const AppContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [years, setYears] = useState<number[]>([])
  const [athletes, setAthletes] = useState<Map<string, Athlete>>(new Map<string, Athlete>())
  const [teams, setTeams] = useState<Map<number, Team>>(new Map<number, Team>())
  const [athleteLookupTable, setAthleteLookupTable] = useState<Map<string, string>>(new Map<string, string>())
  const [events, setAllEvents] = useState<Map<number, EventSummary[]>>(new Map<number, EventSummary[]>())
  const [series, setAllSeries] = useState<Map<number, SerieSummary[]>>(new Map<number, SerieSummary[]>())
  const [loadingStartupData, setLoadingStartupData] = useState<boolean>(true)

  const setEvents = useCallback(async (events: EventSummary[], year: number) => {
    setAllEvents((prevState) => (new Map(prevState).set(year, events)))
  }, [setAllEvents])

  const setSeries = useCallback(async (series: SerieSummary[], year: number) => {
    setAllSeries((prevState) => (new Map(prevState).set(year, series)))
  }, [setAllSeries])

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

  const value = {
    athletes,
    findAthlete,
    setAthletes,
    setAthleteLookupTable,
    teams,
    findTeam,
    setTeams,
    years,
    setYears,
    events,
    setEvents,
    series,
    setSeries,
    loadingStartupData,
    setLoadingStartupData,
  }

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  )
}