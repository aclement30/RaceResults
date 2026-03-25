import { AppShell } from '@mantine/core'
import { AdminNavbar } from '../Navbar/Navbar'
import { useEffect, useState } from 'react'
import { showErrorMessage } from '../../utils/showErrorMessage'
import { adminApi } from '../utils/api'
import { useParams } from 'react-router'
import { AdminAthleteList } from './List/List'
import { AdminAthleteEdit } from './Edit/Edit'
import type { Athlete, Team } from '../../../shared/types'

export const AdminAthletes = () => {
  const [loadingData, setLoadingData] = useState<boolean>(true)
  const [athletes, setAthletes] = useState<Athlete[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const params = useParams<{ athleteUciId: string }>()

  const fetchData = async () => {
    try {
      setLoadingData(true)

      const [
        allAthletes,
        allTeams,
      ] = await Promise.all([
        adminApi.get.athletes(),
        adminApi.get.teams(),
      ])

      setAthletes(allAthletes)
      setTeams(allTeams)
    } catch (error) {
      showErrorMessage({ title: 'Error', message: (error as any).message })
    } finally {
      setLoadingData(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleAthleteChange = async () => {
    await fetchData()
  }

  return (
    <>
      <AdminNavbar/>

      <AppShell.Main style={{
        backgroundImage: 'url(/header-bg.png)',
        backgroundPosition: 'top 60px right',
        backgroundRepeat: 'no-repeat',
      }}>
        {params.athleteUciId ? (
          <AdminAthleteEdit loading={loadingData} teams={teams} onChange={handleAthleteChange}/>
        ) : (
          <AdminAthleteList athletes={athletes} loading={loadingData}/>
        )}
      </AppShell.Main>
    </>
  )
}