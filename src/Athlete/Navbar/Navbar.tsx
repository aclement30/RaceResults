import { AppShell, Divider, Group, NavLink, Stack, Text } from '@mantine/core'
import { useContext, useMemo } from 'react'
import { AppContext } from '../../AppContext'
import { Credit } from '../../Shared/Credit'
import { AthleteSearchField } from '../../Shared/AthleteSearchField'
import { useNavigator } from '../../utils/useNavigator'
import { IconFlag3, IconTrendingUp, IconUser, IconUsersGroup } from '@tabler/icons-react'
import { useNavigate } from 'react-router'

const currentYear = new Date().getFullYear()

export const Navbar = () => {
  const { navigateToAthlete, navigateToTeam } = useNavigator()
  const navigate = useNavigate()
  const { closeNavbar, favoriteAthletes, favoriteTeams, teams, athletes } = useContext(AppContext)

  const handleSelectTeam = (teamId: number) => {
    closeNavbar()
    navigateToTeam(teamId)
  }

  const handleSelectAthlete = (athleteUciId: string) => {
    closeNavbar()
    navigateToAthlete(athleteUciId)
  }

  const favoriteTeamRows = useMemo(() => {
    return favoriteTeams.map((teamId) => {
      const team = teams.get(teamId)
      if (!team) return null

      return (
        <NavLink
          key={teamId}
          label={
            <Stack
              align="stretch"
              gap="0"
              style={{ width: '100%' }}
            >
              <Text>{team.name}</Text>
            </Stack>
          }
          onClick={() => handleSelectTeam(teamId)}>
        </NavLink>
      )
    }).filter(Boolean)
  }, [favoriteTeams, teams])

  const favoriteAthleteRows = useMemo(() => {
    return favoriteAthletes.map((athleteUciId) => {
      const athlete = athletes.get(athleteUciId)
      if (!athlete) return null

      const team = athlete.team?.[currentYear] || null

      return (
        <NavLink
          key={athleteUciId}
          label={
            <Group
              align="stretch"
              justify="space-between"
              style={{ width: '100%', flexWrap: 'nowrap' }}
            >
              <Text size="sm" style={{ flex: '1 0 auto' }}>{`${athlete.firstName} ${athlete.lastName}`}</Text>
              <Text c="dimmed" size="sm" style={{
                flex: '0 1 auto',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis'
              }}>{team?.name || 'Independent'}</Text>
            </Group>
          }
          onClick={() => handleSelectAthlete(athleteUciId)}>
        </NavLink>
      )
    }).filter(Boolean)
  }, [favoriteAthletes, athletes])

  return (
    <AppShell.Navbar p="md" style={{ paddingBottom: 0 }} className="no-print">
      <div style={{ flex: '1 1 auto' }}>
        <div style={{ marginBottom: '1rem' }}>
          <AthleteSearchField onSelect={handleSelectAthlete}
                              dropdownTop="calc(var(--app-shell-header-height) + var(--mantine-spacing-md) + 36px + var(--mantine-spacing-md))"/>

        </div>

        {!!favoriteTeamRows.length && (
          <>
            <Divider/>

            <NavLink label="Favorite Teams" leftSection={<IconUsersGroup/>} opened={true} disabled rightSection={false}
                     childrenOffset={0} style={{ marginTop: '0.5rem' }}>
              {favoriteTeamRows}
            </NavLink>
          </>
        )}

        {!!favoriteAthleteRows.length && (
          <>
            <Divider style={{ marginTop: '0.5rem' }}/>

            <NavLink label="Favorite Athletes" leftSection={<IconUser/>} opened={true} disabled rightSection={false}
                     childrenOffset={0} style={{ marginTop: '0.5rem' }}>
              {favoriteAthleteRows}
            </NavLink>
          </>
        )}

        <Divider style={{ margin: '0.5rem 0' }}/>

        {/*<NavLink onClick={() => {*/}
        {/*  closeNavbar()*/}
        {/*  navigate('/athletes/list/all')*/}
        {/*}} label="All Athletes" leftSection={<IconUsers/>}/>*/}

        <NavLink onClick={() => {
          closeNavbar()
          navigate('/athletes/list/recently-upgraded')
        }} label="Recently Upgraded Athletes"
                 leftSection={<IconTrendingUp/>}/>

        <NavLink onClick={() => {
          closeNavbar()
          navigate('/athletes/list/points-collectors')
        }} label="Points Collectors" leftSection={<IconFlag3/>}/>
      </div>

      <Credit/>
    </AppShell.Navbar>
  )
}