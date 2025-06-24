import { type ReactElement, useContext, useMemo } from 'react'
import { AppContext } from '../AppContext'
import { useParams, useSearchParams } from 'react-router'
import {
  AppShell,
  Table,
  Anchor, Group, Divider,
  Alert,
  Text, Tabs, Badge, ActionIcon
} from '@mantine/core'
import type { Athlete } from '../types/athletes'
import { Navbar } from '../Athlete/Navbar/Navbar'
import { renderSkillLevelWithAgeCategory } from '../Athlete/utils'
import {
  IconBrandFacebook,
  IconBrandInstagram,
  IconWorldWww
} from '@tabler/icons-react'
import { FavoriteButton } from '../Shared/FavoriteButton'
import { useNavigator } from '../utils/useNavigator'

const currentYear = new Date().getFullYear()

export const Team: React.FC = () => {
  const { athletes, teams, favoriteTeams, toggleFavoriteTeam } = useContext(AppContext)
  const { navigateToAthlete } = useNavigator()

  const params = useParams()
  const { teamId: teamIdStr } = params
  const teamId = +teamIdStr!
  // const teamName = team!.replace(/-/g, ' ')

  const [searchParams, setSearchParams] = useSearchParams()
  const selectedTab = searchParams.get('tab')

  const selectedTeam = useMemo(() => teams.get(teamId), [teamId])

  const teamAthletes = useMemo(() => {
    const filteredAthletes: Athlete[] = []

    athletes.forEach((athlete: Athlete) => {
      if (athlete.team?.[currentYear]?.id === teamId) {
        filteredAthletes.push(athlete)
      }
    })

    return filteredAthletes.sort((a, b) => (`${a.firstName}${a.lastName}`).localeCompare(`${b.firstName}${b.lastName}`))
  }, [athletes, teamId])

  const handleTabChamge = (tab: string | null) => {
    if (!tab) {
      setSearchParams(new URLSearchParams())
    } else {
      setSearchParams(new URLSearchParams({ tab }))
    }
  }

  const rows = useMemo(() => {
    const athleteByGenders = ['M', 'F', 'X', 'Y'].reduce((acc, gender) => {
      let filteredAthletes = teamAthletes.filter(a => a.gender === gender)
      if (gender === 'Y') {
        filteredAthletes = teamAthletes.filter(a => a.ageCategory?.ROAD && [
          'YOUTH',
          'JUNIOR',
          'U17',
          'U19',
        ].includes(a.ageCategory.ROAD.toUpperCase()))
      } else {
        filteredAthletes = filteredAthletes.filter(a => !a.ageCategory?.ROAD || ![
          'YOUTH',
          'JUNIOR',
          'U17',
          'U19',
        ].includes(a.ageCategory.ROAD.toUpperCase()))
      }

      const rows = filteredAthletes.map((athlete) => {
        return (
          <Table.Tr key={athlete.uciId}>
            <Table.Td>
              <Anchor onClick={() => navigateToAthlete(athlete.uciId)}>
                {athlete.firstName} {athlete.lastName?.toUpperCase()}
              </Anchor>
            </Table.Td>
            <Table.Td style={{ textAlign: 'center' }}>{athlete.birthYear && currentYear - athlete.birthYear}</Table.Td>
            <Table.Td style={{ textAlign: 'center' }}>
              {renderSkillLevelWithAgeCategory(athlete)}
            </Table.Td>
            <Table.Td visibleFrom="sm">{athlete.uciId}</Table.Td>
          </Table.Tr>
        )
      })

      if (rows.length > 0) acc[gender] = rows

      return acc
    }, {} as Record<string, ReactElement[]>)

    return athleteByGenders
  }, [teamAthletes])

  const tableHeader = useMemo(() => {
    return (
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Name</Table.Th>
          <Table.Th style={{ textAlign: 'center' }}>Age</Table.Th>
          <Table.Th style={{ textAlign: 'center' }}>Category</Table.Th>
          <Table.Th visibleFrom="sm">UCI ID</Table.Th>
        </Table.Tr>
      </Table.Thead>
    )
  }, [])

  const renderWebsiteLink = () => {
    if (!selectedTeam?.website) return null

    let icon = <IconWorldWww/>
    if (selectedTeam?.website.includes('instagram.com')) {
      icon = <IconBrandInstagram/>
    } else if (selectedTeam?.website.includes('facebook.com')) {
      icon = <IconBrandFacebook/>
    }

    return (
      <ActionIcon variant="light" aria-label="Settings" style={{ marginTop: '0.5rem' }} component="a"
                  href={`https://${selectedTeam.website}`} target="_blank" rel="noopener noreferrer">
        {icon}
      </ActionIcon>
    )
  }

  const defaultTab = useMemo(() => {
    if (rows['M']?.length) return 'men'
    else if (rows['F']?.length) return 'women'
    else if (rows['X']?.length) return 'open'
    else if (rows['Y']?.length) return 'juniors'
  }, [rows])

  const showTabs = useMemo(() => {
    return Object.keys(rows).length > 1
  }, [rows])

  return (
    <>
      <Navbar/>

      <AppShell.Main>
        {teamAthletes && (
          <>
            <Group justify="space-between" style={{ alignItems: 'flex-start' }}>
              <div>
                <Group gap={5} style={{ alignItems: 'center' }}>
                  <h2 style={{ marginTop: 0, marginBottom: 0 }}>
                    {selectedTeam?.name}
                  </h2>

                  {!!selectedTeam?.id && (
                    <FavoriteButton isFavorite={favoriteTeams.includes(selectedTeam.id)}
                                    iconOnly={true}
                                    onClick={() => toggleFavoriteTeam(selectedTeam.id)}/>
                  )}
                </Group>
                <Text size="compact-md">
                  {selectedTeam?.city}
                </Text>
              </div>

              <div>
                {renderWebsiteLink()}
              </div>
              {/*<div className="mantine-visible-from-sm"><OrganizerBadge organizerAlias={serieSummary.organizerAlias}/>*/}
            </Group>
            <Divider my="md"/>

            <Tabs value={selectedTab || defaultTab} onChange={handleTabChamge} keepMounted={false}>
              {showTabs && (
                <Tabs.List style={{ overflowX: 'auto', flexWrap: 'nowrap' }}>
                  {!!rows['M']?.length && (
                    <Tabs.Tab value="men">
                      Men <Badge variant="light">{rows['M']?.length}</Badge>
                    </Tabs.Tab>
                  )}

                  {!!rows['F']?.length && (
                    <Tabs.Tab value="women">
                      Women <Badge variant="light">{rows['F']?.length}</Badge>
                    </Tabs.Tab>
                  )}

                  {!!rows['X']?.length && (
                    <Tabs.Tab value="open">
                      Open <Badge variant="light">{rows['X']?.length}</Badge>
                    </Tabs.Tab>
                  )}

                  {!!rows['Y']?.length && (
                    <Tabs.Tab value="juniors">
                      Juniors <Badge variant="light">{rows['Y']?.length}</Badge>
                    </Tabs.Tab>
                  )}
                </Tabs.List>
              )}

              <Tabs.Panel value="men">
                <Table stickyHeader stickyHeaderOffset={60} withTableBorder style={{ marginTop: '1rem' }}>
                  {tableHeader}
                  <Table.Tbody>{rows['M']}</Table.Tbody>
                </Table>
              </Tabs.Panel>

              <Tabs.Panel value="women">
                <Table stickyHeader stickyHeaderOffset={60} withTableBorder style={{ marginTop: '1rem' }}>
                  {tableHeader}
                  <Table.Tbody>{rows['F']}</Table.Tbody>
                </Table>
              </Tabs.Panel>

              <Tabs.Panel value="open">
                <Table stickyHeader stickyHeaderOffset={60} withTableBorder style={{ marginTop: '1rem' }}>
                  {tableHeader}
                  <Table.Tbody>{rows['X']}</Table.Tbody>
                </Table>
              </Tabs.Panel>

              <Tabs.Panel value="juniors">
                <Table stickyHeader stickyHeaderOffset={60} withTableBorder style={{ marginTop: '1rem' }}>
                  {tableHeader}
                  <Table.Tbody>{rows['Y']}</Table.Tbody>
                </Table>
              </Tabs.Panel>
            </Tabs>

            <Alert variant="light" style={{ marginTop: '1rem' }}>
              Note: Athletes are listed by their current team affiliation for {currentYear}.
              If an athlete has not competed in the current year, they may not appear in this list.
            </Alert>
          </>
        )}
      </AppShell.Main>
    </>
  )
}