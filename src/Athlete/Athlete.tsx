import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { AppContext } from '../AppContext'
import { useParams, useSearchParams } from 'react-router'
import {
  AppShell,
  LoadingOverlay,
  Avatar,
  Paper,
  Text,
  Grid,
  Divider,
  Tabs,
  useMatches, Group,
} from '@mantine/core'
import { FETCH_ERROR_TYPE, fetchAthleteProfile, FetchError } from '../utils/aws-s3'
import { Loader } from '../Loader/Loader'
import type { AthleteProfile } from '../types/athletes'
import { showErrorMessage } from '../utils/showErrorMessage'
import { UpgradePointsTable } from './UpgradePointsTable/UpgradePointsTable'
import { Navbar } from './Navbar/Navbar'
import { displayAthleteCurrentTeam, renderSkillLevelWithAgeCategory } from './utils'
import { RacesTable } from './RacesTable/RacesTable'
import { getCountryCode } from '../utils/getCountryCode'
import { IconBike, IconStars } from '@tabler/icons-react'
import { useNavigator } from '../utils/useNavigator'
import { FavoriteButton } from '../Shared/FavoriteButton'
import { ResourceNotFound } from '../Shared/ResourceNotFound'
import { UserFavoriteContext } from '../UserFavoriteContext'

const currentYear = new Date().getFullYear()

export const Athlete: React.FC = () => {
  const { athletes } = useContext(AppContext)
  const { favoriteAthletes, toggleFavoriteAthlete } = useContext(UserFavoriteContext)
  const [athleteProfile, setAthleteProfile] = useState<AthleteProfile | null>(null)
  const [loadingProfile, setLoadingProfile] = useState<boolean>(true)
  const { navigateToTeam } = useNavigator()

  const avatarSize = useMatches({
    base: 'lg',
    sm: 'xl',
  })

  const params = useParams()
  const { uciId } = params
  const athleteUciId = uciId!

  const [searchParams, setSearchParams] = useSearchParams()
  const selectedTab = searchParams.get('tab') || 'races'

  const selectedAthlete = useMemo(() => athletes.get(athleteUciId), [athletes, params])

  const fetchData = useCallback(async (athleteUciId: string) => {
    try {
      setLoadingProfile(true)

      console.log(`Fetching athlete profile for: ${athleteUciId}`)
      const profile = await fetchAthleteProfile(athleteUciId)

      setAthleteProfile(profile)
    } catch (error) {
      if (error instanceof FetchError && error.type === FETCH_ERROR_TYPE.NotFound) {
        // Show a Resource Not Found error instead of the error message
      } else {
        showErrorMessage({ title: 'Error', message: (error as any).message })
      }
    } finally {
      setLoadingProfile(false)
    }
  }, [setLoadingProfile, setAthleteProfile, athleteUciId])

  useEffect(() => {
    fetchData(athleteUciId)
  }, [athleteUciId])

  const handleTabChamge = (tab: string | null) => {
    if (!tab) {
      setSearchParams(new URLSearchParams())
    } else {
      window.umami?.track('view-athlete-tab', { tab })
      setSearchParams(new URLSearchParams({ tab }))
    }
  }

  const cityProvinceLabel = useMemo(() => {
    if (!selectedAthlete) return ''
    return [
      selectedAthlete.city,
      selectedAthlete.province
    ].filter(Boolean).join(', ')
  }, [selectedAthlete])

  return (
    <>
      <Navbar/>

      <AppShell.Main>
        {!selectedAthlete && !loadingProfile && (
          <ResourceNotFound title="Athlete Not Found" text="Sorry, we could not find the requested athlete profile."/>)}

        {selectedAthlete && (
          <>
            <Grid>
              <Grid.Col span={{ base: 12, lg: 4 }}>
                <Paper shadow="xs" p="md" style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                    <Avatar color="cyan" size={avatarSize} style={{ flex: '0 0 auto' }}>
                      {selectedAthlete.firstName?.slice(0, 1)}{selectedAthlete.lastName?.slice(0, 1)}
                    </Avatar>

                    <div style={{ marginLeft: '1rem', }}>
                      <h2
                        style={{
                          margin: '0 0 0.25rem',
                          lineHeight: '1.2em'
                        }}>
                        {selectedAthlete.firstName} {selectedAthlete.lastName}
                      </h2>

                      <Group justify="space-between" gap="xs" style={{ alignItems: 'center', flex: '1 1 auto' }}>
                        <Text c="dimmed">
                          {!!selectedAthlete.nationality && (
                            <span style={{ verticalAlign: 'baseline', paddingRight: 10 }}>
                            <img
                              src={`https://purecatamphetamine.github.io/country-flag-icons/3x2/${getCountryCode(selectedAthlete.nationality)}.svg`}
                              height={12}/>
                          </span>
                          )}

                          {selectedAthlete.gender} {selectedAthlete.birthYear ? currentYear - selectedAthlete.birthYear : ''} {!!cityProvinceLabel.length && `| ${cityProvinceLabel}`}
                        </Text>

                        <FavoriteButton isFavorite={favoriteAthletes.includes(selectedAthlete.uciId)}
                                        className="mantine-hidden-from-sm"
                                        iconOnly={true}
                                        data-umami-event="toggle-favorite-athlete"
                                        onClick={() => toggleFavoriteAthlete(selectedAthlete.uciId)}/>
                      </Group>
                    </div>
                  </div>

                  <Divider style={{ marginTop: '1.5rem' }}/>

                  <Grid style={{ marginTop: '1rem' }}>
                    <Grid.Col span={6}>
                      <>
                        <Text style={{ color: 'black' }} size="xs">CATEGORY</Text>
                        {renderSkillLevelWithAgeCategory(selectedAthlete) || '-'}
                      </>
                    </Grid.Col>

                    <Grid.Col span={6}>
                      <Text style={{ color: 'black' }}
                            size="xs">TEAM
                      </Text>
                      {displayAthleteCurrentTeam(selectedAthlete, navigateToTeam)}
                    </Grid.Col>

                    <Grid.Col span={6} visibleFrom="sm">
                      <Text style={{ color: 'black' }} size="xs">UCI ID</Text>
                      {selectedAthlete.uciId}
                    </Grid.Col>
                  </Grid>
                </Paper>

                <FavoriteButton isFavorite={favoriteAthletes.includes(selectedAthlete.uciId)}
                                className="mantine-visible-from-sm"
                                onClick={() => toggleFavoriteAthlete(selectedAthlete.uciId)}/>
              </Grid.Col>

              <Grid.Col span={{ base: 12, lg: 8 }} pos="relative">
                <LoadingOverlay
                  visible={loadingProfile} overlayProps={{ radius: 'sm', blur: 2 }}
                  loaderProps={{
                    children: <Loader text="Loading athlete profile..."/>,
                  }}
                />

                <Tabs value={selectedTab} onChange={handleTabChamge} keepMounted={false}>
                  <Tabs.List style={{ overflowX: 'auto', flexWrap: 'nowrap' }}>
                    <Tabs.Tab value="races" leftSection={<IconBike/>}>
                      Races
                    </Tabs.Tab>

                    <Tabs.Tab value="points" leftSection={<IconStars/>}>
                      Upgrade Points
                    </Tabs.Tab>
                  </Tabs.List>

                  <Tabs.Panel value="races">
                    <RacesTable races={athleteProfile?.races}/>
                  </Tabs.Panel>

                  <Tabs.Panel value="points">
                    <UpgradePointsTable skillLevel={selectedAthlete.skillLevel}
                                        upgradePoints={athleteProfile?.upgradePoints}
                                        latestUpgrade={selectedAthlete.latestUpgrade}
                    />
                  </Tabs.Panel>

                </Tabs>
              </Grid.Col>
            </Grid>
          </>
        )}
      </AppShell.Main>
    </>
  )
}