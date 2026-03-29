import { AppShell } from '@mantine/core'
import { useContext, useEffect, useMemo, useState } from 'react'
import { useLocation, useParams, useSearchParams } from 'react-router'
import type { RaceEvent, Serie } from '../../../shared/types'
import { showErrorMessage } from '../../utils/showErrorMessage'
import { AdminNavbar } from '../Navbar/Navbar'
import { AdminContext } from '../Shared/AdminContext'
import { adminApi } from '../utils/api'
import { AdminEventEdit } from './Edit/Edit'
import { AdminEventList } from './List/List'

const CURRENT_YEAR = new Date().getFullYear()

export const AdminEvents = () => {
  const [loadingData, setLoadingData] = useState<boolean>(true)
  const [events, setEvents] = useState<RaceEvent[]>([])
  const [series, setSeries] = useState<Serie[]>([])
  const params = useParams<{ year: string, eventHash: string, tab?: string }>()
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const { setAthletes, setAthleteLookupTable, setTeams } = useContext(AdminContext)

  const selectedYear = params.year || searchParams.get('year') || CURRENT_YEAR

  useEffect(() => {
    const fetchAthletesAndTeams = async () => {
      try {
        const [athletes, lookupTable, teams] = await Promise.all([
          adminApi.get.athletes(),
          adminApi.get.athleteLookupTable(),
          adminApi.get.teams(),
        ])

        setAthletes(new Map(athletes.map((athlete) => [athlete.uciId, athlete])))
        setAthleteLookupTable(new Map(Object.entries(lookupTable)))
        setTeams(new Map(teams.map((team) => [+team.id, team])))
      } catch {
        showErrorMessage({ title: 'Error', message: 'Failed to load athletes' })
      }
    }

    fetchAthletesAndTeams()
  }, [])

  const fetchData = async () => {
    try {
      setLoadingData(true)

      const [
        yearEvents,
        yearSeries,
      ] = await Promise.all([
        adminApi.get.events({ year: +selectedYear }),
        adminApi.get.series({ year: +selectedYear }),
      ])

      setEvents(yearEvents)
      setSeries(yearSeries)
    } catch (error) {
      showErrorMessage({ title: 'Error', message: (error as any).message })

      setEvents([])
      setSeries([])
    } finally {
      setLoadingData(false)
    }
  }

  const selectedEvent = useMemo(() => {
    if (!params.eventHash) return undefined
    return events.find(e => e.date.startsWith(selectedYear.toString()) && e.hash === params.eventHash) || undefined
  }, [params.eventHash, selectedYear, events])

  const handleEventChange = () => {
    fetchData()
  }

  useEffect(() => {
    fetchData()
  }, [location.pathname, selectedYear])

  return (
    <>
      <AdminNavbar/>

      <AppShell.Main style={{
        // backgroundImage: 'url(/header-bg.png)',
        backgroundPosition: 'top 60px right',
        backgroundRepeat: 'no-repeat',
        height: '100%',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
      }}>
        {location.pathname === '/admin/events' ? (
          <AdminEventList events={events} series={series} loading={loadingData}/>
        ) : (
          <AdminEventEdit
            eventHash={params.eventHash!}
            year={+selectedYear}
            event={selectedEvent}
            events={events}
            series={series}
            tab={params.tab}
            loading={loadingData}
            onChange={handleEventChange}
          />)}
      </AppShell.Main>
    </>
  )
}