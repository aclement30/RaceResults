import {
  AppShell,
  Divider, Group, LoadingOverlay
} from '@mantine/core'
import { Navbar } from '../Athlete/Navbar/Navbar'
import { AthletesTable } from './AthletesTable/AthletesTable'
import { useEffect, useState } from 'react'
import type { AthleteCompilations } from '../types/athletes'
import { fetchAthleteCompilations } from '../utils/aws-s3'
import { showErrorMessage } from '../utils/showErrorMessage'
import { useParams } from 'react-router'
import { RecentlyUpgradedAthletesTable } from './RecentlyUpgradedAthletesTable/RecentlyUpgradedAthletesTable'
import { PointsCollectorsTable } from './PointsCollectorsTable/PointsCollectorsTable'
import { Loader } from '../Loader/Loader'

export const Athletes: React.FC = () => {
  const params = useParams()
  const { list: selectedList = 'all' } = params

  const [athleteCompilations, setAthleteCompilations] = useState<AthleteCompilations | null>(null)
  const [loadingCompilations, setLoadingCompilations] = useState<boolean>(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingCompilations(true)

        const athleteCompilations = await fetchAthleteCompilations()

        setAthleteCompilations(athleteCompilations)
      } catch (error) {
        showErrorMessage((error as any).message)
      } finally {
        setLoadingCompilations(false)
      }
    }

    fetchData()
  }, [])

  let title = 'Athletes'
  let tableComponent = <AthletesTable/>

  if (selectedList === 'recently-upgraded') {
    title = 'Recently Upgraded Athletes'
    tableComponent =
      <RecentlyUpgradedAthletesTable recentlyUpgradedAthletes={athleteCompilations?.recentlyUpgradedAthletes}/>
  } else if (selectedList === 'points-collectors') {
    title = 'Points Collectors'
    tableComponent = <PointsCollectorsTable pointsCollectors={athleteCompilations?.pointsCollectors}/>
  }

  return (
    <>
      <Navbar/>

      <AppShell.Main>
        <Group justify="space-between" style={{ alignItems: 'flex-start' }}>
          <div>
            <Group gap={5} style={{ alignItems: 'center' }}>
              <h2 style={{ marginTop: 0, marginBottom: 0 }}>{title}</h2>
            </Group>
          </div>
        </Group>

        <Divider my="md"/>

        <LoadingOverlay
          visible={loadingCompilations} overlayProps={{ radius: 'sm', blur: 2 }}
          loaderProps={{
            children: <Loader text="Loading data..."/>,
          }}
        />

        {tableComponent}
      </AppShell.Main>
    </>
  )
}