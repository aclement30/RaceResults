import { AppShell } from '@mantine/core'
import { useContext, useEffect, useState } from 'react'
import { useLocation, useParams, useSearchParams } from 'react-router'
import type { Serie } from '../../../shared/types'
import { showErrorMessage } from '../../utils/showErrorMessage'
import { AdminNavbar } from '../Navbar/Navbar'
import { AdminContext } from '../Shared/AdminContext'
import { adminApi } from '../utils/api'
import { AdminSerieList } from './List/List'

const CURRENT_YEAR = new Date().getFullYear()

export const AdminSeries = () => {
  const [loadingData, setLoadingData] = useState<boolean>(true)
  const [series, setSeries] = useState<Serie[]>([])
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

      const [
        yearSeries,
      ] = await Promise.all([
        adminApi.get.series({ year: +selectedYear }),
      ])

      setSeries(yearSeries)
    } catch (error) {
      showErrorMessage({ title: 'Error', message: (error as any).message })

      setSeries([])
    } finally {
      setLoadingData(false)
    }
  }

  // const selectedSerie = useMemo(() => {
  //   if (!params.serieHash) return undefined
  //   return series.find(s => s.year === selectedYear.toString() && s.hash === params.serieHash) || undefined
  // }, [params.serieHash, selectedYear, series])
  //
  // const handleSerieChange = () => {
  //   fetchData()
  // }

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
        {/*{location.pathname === '/admin/series' ? (*/}
        <AdminSerieList series={series} year={selectedYear} loading={loadingData}/>
        {/*) : (*/}
        {/*  <AdminSerieEdit*/}
        {/*    serieHash={params.serieHash!}*/}
        {/*    year={+selectedYear}*/}
        {/*    serie={selectedSerie}*/}
        {/*    series={series}*/}
        {/*    tab={params.tab}*/}
        {/*    loading={loadingData}*/}
        {/*    onChange={handleSerieChange}*/}
        {/*  />)}*/}
      </AppShell.Main>
    </>
  )
}