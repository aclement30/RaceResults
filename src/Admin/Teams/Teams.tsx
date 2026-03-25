import { useEffect, useMemo, useState } from 'react'
import { AppShell } from '@mantine/core'
import { useLocation } from 'react-router'
import { AdminNavbar } from '../Navbar/Navbar'
import { showErrorMessage } from '../../utils/showErrorMessage'
import { adminApi } from '../utils/api'
import { useParams } from 'react-router'
import { AdminTeamList } from './List/List'
import { AdminTeamEdit } from './Edit/Edit'
import type { Athlete, Team, TeamRoster } from '../../../shared/types'

export const AdminTeams = () => {
  const [loadingData, setLoadingData] = useState<boolean>(true)
  const [teams, setTeams] = useState<Team[]>([])
  const [teamRosters, setTeamRosters] = useState<TeamRoster[]>([])
  const [athletes, setAthletes] = useState<Athlete[]>([])
  const params = useParams<{ teamId: string }>()
  const location = useLocation()

  const fetchData = async () => {
    try {
      setLoadingData(true)

      const [allTeams, teamRosters, allAthletes] = await Promise.all([
        adminApi.get.teams(),
        adminApi.get.teamRosters(),
        adminApi.get.athletes(),
      ])

      setTeams(allTeams)
      setTeamRosters(teamRosters)
      setAthletes(allAthletes)
    } catch (error) {
      showErrorMessage({ title: 'Error', message: (error as any).message })
    } finally {
      setLoadingData(false)
    }
  }

  const selectedTeam = useMemo(() => {
    if (!params.teamId) return undefined
    return teams.find(t => t.id.toString() === params.teamId) || undefined
  }, [params.teamId, teams])

  useEffect(() => {
    fetchData()
  }, [])

  const handleTeamChange = async () => {
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
        {location.pathname === '/admin/teams' ? (
          <AdminTeamList teams={teams} teamRosters={teamRosters} loading={loadingData} onChange={handleTeamChange}/>
        ) : (
          <AdminTeamEdit
            teamId={params.teamId}
            team={selectedTeam}
            teamRoster={teamRosters.find(r => r.teamId.toString() === params.teamId) || null}
            allTeams={teams}
            athletes={athletes}
            loading={loadingData}
            onChange={handleTeamChange}
          />
        )}
      </AppShell.Main>
    </>
  )
}