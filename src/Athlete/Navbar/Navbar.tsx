import { AppShell, Divider, Group, NavLink, Stack, Text } from '@mantine/core'
import { useContext, useMemo } from 'react'
import { AppContext } from '../../AppContext'
import { Credit } from '../../Shared/Credit'
import { AthleteSearchField } from '../../Shared/AthleteSearchField'
import { useNavigator } from '../../utils/useNavigator'
import { IconTrendingUp, IconUser, IconUsersGroup } from '@tabler/icons-react'
import { NavLink as RouterNavLink } from 'react-router'
import cx from 'clsx'
import { UIContext } from '../../UIContext'
import { UserFavoriteContext } from '../../UserFavoriteContext'

const currentYear = new Date().getFullYear()

export const Navbar = () => {
  const { navigateToAthlete } = useNavigator()
  const { closeNavbar } = useContext(UIContext)
  const { teams, athletes } = useContext(AppContext)
  const { favoriteTeams, favoriteAthletes } = useContext(UserFavoriteContext)

  const handleSelectAthlete = (athleteUciId: string) => {
    closeNavbar()
    navigateToAthlete(athleteUciId)
    window.umami?.track('select-athlete-from-navbar-search', { athleteUciId })
  }

  const favoriteTeamRows = useMemo(() => {
    return favoriteTeams.map((teamId) => {
      const team = teams.get(teamId)
      if (!team) return null

      return (
        <NavLink
          key={teamId}
          renderRoot={({ className, ...others }) => (
            <RouterNavLink
              to={`/teams/${teamId}`}
              className={({ isActive }) =>
                cx(className, { 'active-class': isActive })
              }
              {...others}
            />
          )}
          label={
            <Stack
              align="stretch"
              gap="0"
              style={{ width: '100%' }}
            >
              <Text>{team.name}</Text>
            </Stack>
          }
          onClick={() => closeNavbar()}
          data-umami-event="select-favorite-team-from-navbar"
        />
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
          renderRoot={({ className, ...others }) => (
            <RouterNavLink
              to={`/athletes/${athleteUciId}`}
              className={({ isActive }) =>
                cx(className, { 'active-class': isActive })
              }
              {...others}
            />
          )}
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
          onClick={() => closeNavbar()}
          data-umami-event="select-favorite-athlete-from-navbar"
        />
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

        <NavLink
          renderRoot={({ className, ...others }) => (
            <RouterNavLink
              to="/athletes/list/recently-upgraded"
              className={({ isActive }) =>
                cx(className, { 'active-class': isActive })
              }
              {...others}
            />
          )}
          label="Recently Upgraded Athletes"
          leftSection={<IconTrendingUp/>}
          onClick={() => closeNavbar()}
        />

        {/*<NavLink*/}
        {/*  renderRoot={({ className, ...others }) => (*/}
        {/*    <RouterNavLink*/}
        {/*      to="/athletes/list/points-collectors"*/}
        {/*      className={({ isActive }) =>*/}
        {/*        cx(className, { 'active-class': isActive })*/}
        {/*      }*/}
        {/*      {...others}*/}
        {/*    />*/}
        {/*  )}*/}
        {/*  label="Points Collectors"*/}
        {/*  leftSection={<IconFlag3/>}*/}
        {/*  onClick={() => closeNavbar()}*/}
        {/*/>*/}
      </div>

      <Credit/>
    </AppShell.Navbar>
  )
}