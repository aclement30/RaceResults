import { AppShell, LoadingOverlay } from '@mantine/core'
import { useContext, useEffect, useState } from 'react'
import { Outlet, useLocation, useParams, useSearchParams } from 'react-router'
import type { RaceEvent, Serie } from '../../../shared/types'
import { Loader } from '../../Loader/Loader'
import { showErrorMessage } from '../../utils/showErrorMessage'
import { AdminNavbar } from '../Navbar/Navbar'
import { AdminContext } from '../Shared/AdminContext'
import { adminApi } from '../utils/api'

const CURRENT_YEAR = new Date().getFullYear()

export type AdminSerieOutletContext = {
  series: Serie[]
  events: RaceEvent[]
  year: number
  onSerieChange: () => void
}

export const AdminSeries = () => {
  const [loadingData, setLoadingData] = useState<boolean>(true)
  const [series, setSeries] = useState<Serie[]>([])
  const [events, setEvents] = useState<RaceEvent[]>([])
  const params = useParams<{ year: string, serieHash: string, tab?: string }>()
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const { setAthletes, setAthleteLookupTable, setTeams } = useContext(AdminContext)

  const selectedYear = +(params.year || searchParams.get('year') || CURRENT_YEAR)

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

      const [yearSeries, yearEvents] = await Promise.all([
        adminApi.get.series({ year: +selectedYear }),
        adminApi.get.events({ year: +selectedYear }),
      ])

      setSeries(yearSeries)
      setEvents(yearEvents)
    } catch (error) {
      showErrorMessage({ title: 'Error', message: (error as any).message })

      setSeries([])
    } finally {
      setLoadingData(false)
    }
  }

  const handleSerieChange = () => {
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
        <LoadingOverlay
          visible={loadingData}
          overlayProps={{ radius: 'sm', blur: 2 }}
          loaderProps={{ children: <Loader text="Loading..."/> }}
        />

        <Outlet
          context={{ series, events, year: selectedYear, onSerieChange: handleSerieChange }}/>
      </AppShell.Main>
    </>
  )
}