import { AppShell, Button, Divider, Group, LoadingOverlay, Text } from '@mantine/core'
import { IconFileDownload } from '@tabler/icons-react'
// import { FeedbackWidget } from '../Shared/FeedbackWidget/FeedbackWidget'
import debounce from 'lodash/debounce'
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'react-router'
import type {
  ParticipantSerieEventResult,
  Serie as TSerie,
  SerieStandings,
  TeamSerieEventResult,
} from '../../shared/types'
import { AppContext } from '../AppContext'
import { columns } from '../Event/Shared/columns'
import { DataCorrections } from '../Shared/DataCorrections'
import { LastUpdated } from '../Shared/LastUpdated'
import { OrganizerBadge } from '../Shared/OrganizerBadge'
import { ResourceNotFound } from '../Shared/ResourceNotFound'
import { SearchField } from '../Shared/SearchField'
import { Source } from '../Shared/Source'
import { UIContext } from '../UIContext'
import { FETCH_ERROR_TYPE, FetchError, fetchSerieStandings } from '../utils/aws-s3'
import { exportCSV } from '../utils/exportCSV'
import { showErrorMessage } from '../utils/showErrorMessage'
import { useEventsAndSeries } from '../utils/useEventsAndSeries'
import { IndividualRankingsTable } from './IndividualRankingsTable/IndividualRankingsTable'
import { Navbar } from './Navbar/Navbar'
import { TeamRankingsTable } from './TeamRankingsTable/TeamRankingsTable'
import { useCategoryStandings } from './utils'

export type AggregatedIndividualRanking = Omit<ParticipantSerieEventResult, 'points'> & {
  totalPoints: number
  racePoints: Record<string, number>
  position: number
}

export type AggregatedTeamRanking = Omit<TeamSerieEventResult, 'points'> & {
  totalPoints: number
  racePoints: Record<string, number>
  position: number
}

export const Serie: React.FC = () => {
  const { series, findAthlete } = useContext(AppContext)
  const { loading } = useContext(UIContext)
  const [serie, setSerie] = useState<TSerie | null>(null)
  const [serieStandings, setSerieStandings] = useState<SerieStandings | null>(null)
  const [searchValue, setSearchValue] = useState('')
  const [loadingStandings, setLoadingStandings] = useState<boolean>(true)
  const [loadingCsv, setLoadingCsv] = useState(false)

  const params = useParams<{ resultType: 'individual' | 'team', year: string, hash: string }>()
  const { year, hash, resultType } = params
  const serieYear = +year!
  const serieHash = hash!

  const [searchParams] = useSearchParams()
  const selectedCategory = searchParams.get('category') || serieStandings?.categories?.[0].alias
  const selectedTeam = searchParams.get('team')

  const selectedSerie = useMemo(() => series.get(serieYear)?.find(({ hash }) => hash === params.hash!), [
    series,
    params
  ])

  useEventsAndSeries(serieYear)

  const fetchData = useCallback(async (year: number, hash: string) => {
    try {
      setLoadingStandings(true)

      console.log(`Fetching serie standings for: ${year}/${hash}`)

      const { serieStandings } = await fetchSerieStandings(year, hash)

      setSerieStandings(serieStandings)
    } catch (error) {
      if (error instanceof FetchError && error.type === FETCH_ERROR_TYPE.NotFound) {
        // Show a Resource Not Found error instead of the error message
      } else {
        showErrorMessage({ title: 'Error', message: (error as any).message })
      }
    } finally {
      setLoadingStandings(false)
    }
  }, [setSerieStandings, setLoadingStandings])

  useEffect(() => {
    if (series.get(serieYear)) {
      const serieSummary = series.get(serieYear)?.find(({ hash }) => hash === serieHash)

      if (serieSummary) setSerie(serieSummary)

      fetchData(serieYear, serieHash)
    }
  }, [serieYear, serieHash, series])

  useEffect(() => {
    if (selectedTeam?.length) setSearchValue(selectedTeam)
  }, [selectedTeam])

  useEffect(() => {
    setSearchValue('')
  }, [selectedCategory])

  const debouncedSearchTracking = debounce(() => {
    window.umami?.track('search-serie-participant')
  }, 1000)

  const handleSearchChange = (searchValue: string) => {
    setSearchValue(searchValue)
    debouncedSearchTracking()
  }

  const selectedSerieCategory = useMemo(() => selectedCategory ? serieStandings?.categories.find(c => c.alias === selectedCategory) : undefined, [
    selectedCategory,
    serieStandings,
    resultType
  ])

  const computedStandings = useMemo(() => {
    if (!serieStandings) return []

    const aggregatedStandings = new Map<string, AggregatedIndividualRanking | AggregatedTeamRanking>()

    if (resultType === 'individual') {
      for (const event of serieStandings.individual?.events ?? []) {
        if (!selectedCategory || !(selectedCategory in event.categories)) continue

        const { standings: categoryStandings } = event.categories[selectedCategory]
        for (const standing of categoryStandings) {
          const key = `${standing.bibNumber}-${standing.firstName}-${standing.lastName}`

          if (standing.points <= 0) continue

          if (!aggregatedStandings.has(key)) {
            aggregatedStandings.set(key, {
              participantId: standing.participantId,
              uciId: standing.uciId,
              firstName: standing.firstName,
              lastName: standing.lastName,
              bibNumber: standing.bibNumber,
              team: standing.team,
              totalPoints: standing.points,
              racePoints: { [event.date!]: standing.points },
              position: 0,
            })
          } else {
            const aggregatedStanding = aggregatedStandings.get(key)!
            aggregatedStanding.racePoints[event.date!] = standing.points
            aggregatedStanding.totalPoints += standing.points
          }
        }
      }
    } else {
      for (const event of serieStandings.team?.events ?? []) {
        if (!selectedCategory || !(selectedCategory in event.categories)) continue

        const { standings: categoryStandings } = event.categories[selectedCategory]

        for (const standing of categoryStandings) {
          if (!aggregatedStandings.has(standing.team)) {
            aggregatedStandings.set(standing.team, {
              team: standing.team,
              totalPoints: standing.points,
              racePoints: { [event.date || '']: standing.points },
              position: 0,
            })
          } else {
            const aggregatedStanding = aggregatedStandings.get(standing.team)!
            aggregatedStanding.racePoints[event.date || ''] = standing.points
            aggregatedStanding.totalPoints += standing.points
          }
        }
      }
    }

    return [...aggregatedStandings.values()]
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .map((result, index) => ({ ...result, position: index + 1 }))
  }, [serieStandings, resultType, selectedCategory])

  const {
    filteredStandings,
  } = useCategoryStandings(computedStandings, searchValue)

  const eventDates = useMemo(() => {
    if (!serieStandings) return []

    const dates = new Set<string>()

    serieStandings[resultType!]?.events.forEach(event => {
      if (selectedCategory && event.categories[selectedCategory]) {
        dates.add(event.date || '')
      }
    })

    return Array.from(dates).sort()
  }, [serieStandings, resultType, selectedCategory])

  const corrections = useMemo(() => {
    if (!selectedSerieCategory) return ''

    // Combine corrections from all events in the category, split by new lines, and filter out empty lines
    let allCorrections = ''

    serieStandings?.[resultType!]?.events.forEach((event) => {
      const categoryCorrections = event.categories[selectedSerieCategory.alias]?.corrections
      if (categoryCorrections) {
        allCorrections += '\n' + categoryCorrections
      }
    })

    return allCorrections.split('\n').map(line => line.trim()).filter(line => line.length > 0).join('\n')
  }, [serieStandings, selectedSerieCategory, resultType])

  const lastUpdated = useMemo(() => {
    if (!selectedSerieCategory) return null

    const eventUpdateTimes = serieStandings?.[resultType!]?.events.map(event => event.categories[selectedSerieCategory.alias]?.updatedAt).filter(Boolean) || []

    if (eventUpdateTimes.length === 0) return null

    return new Date(Math.max(...eventUpdateTimes.map(date => new Date(date!).getTime())))
  }, [serieStandings, selectedSerieCategory, resultType])

  const individualCategories = useMemo(() => {
    if (!serieStandings?.individual) return []

    const usedAliases = new Set(
      serieStandings.individual.events.flatMap(event => Object.keys(event.categories || {}))
    )

    return serieStandings.categories.filter(c => usedAliases.has(c.alias))
  }, [serieStandings])

  const teamCategories = useMemo(() => {
    if (!serieStandings?.team) return []

    const usedAliases = new Set(
      serieStandings.team.events.flatMap(event => Object.keys(event.categories || {}))
    )

    return serieStandings.categories.filter(c => usedAliases.has(c.alias))
  }, [serieStandings])

  const handleExportCSV = async () => {
    let exportedRows: Array<string | number | undefined>[] = []
    let exportedColumns: string[] = []

    if (resultType === 'individual') {
      if (!serieStandings?.individual) return

      exportedRows = (filteredStandings as AggregatedIndividualRanking[]).map((standing) => {
        const athleteProfile = findAthlete(standing)
        const team = standing.team || athleteProfile?.teams?.[serie!.year]?.name

        return [
          standing.position.toString(),
          columns.name(standing, { text: true }) as string,
          standing.bibNumber?.toString(),
          team,
          standing.totalPoints.toString(),
          ...Object.keys(standing.racePoints).sort().reverse().map(date => standing.racePoints[date].toString()),
        ]
      })

      exportedColumns = [
        'Position',
        'Name',
        'BibNumber',
        'Team',
        'Points',
        ...(serieStandings.individual.events || []).map(e => e.date || '')
      ]
    } else {
      if (!serieStandings?.team) return

      const isCombinedPoints = serieStandings.team.events.length === 1 && serieStandings.team.events[0].combinedPoints

      exportedRows = (filteredStandings as AggregatedTeamRanking[]).map((standing) => {
        let row = [
          standing.position.toString(),
          standing.team,
          standing.totalPoints.toString(),
        ]

        if (!isCombinedPoints) {
          row = row.concat(Object.keys(standing.racePoints).sort().reverse().map(date => standing.racePoints[date].toString()))
        }

        return row
      })

      exportedColumns = [
        'Position',
        'Team',
        'Points',
      ]

      if (!isCombinedPoints) {
        exportedColumns.push(...Object.keys((filteredStandings as AggregatedTeamRanking[])[0]?.racePoints || {}).sort().reverse())
      }
    }

    setLoadingCsv(true)

    try {
      await exportCSV(exportedRows, exportedColumns, 'results')
    } catch (error) {
      // @ts-ignore
      showErrorMessage({ title: 'CSV Export Error', message: error.message })
    } finally {
      setLoadingCsv(false)
    }
  }

  return (
    <>
      <LoadingOverlay visible={loading} loaderProps={{ children: 'Loading series...' }}/>

      {serie &&
        <Navbar
          serie={serie}
          teamCategories={teamCategories}
          individualCategories={individualCategories}
          selectedCategory={selectedCategory}/>
      }

      <AppShell.Main>
        <LoadingOverlay visible={loadingStandings} loaderProps={{ children: 'Loading results...' }}/>

        {!selectedSerie && !loadingStandings && (
          <ResourceNotFound title="Series Not Found" text="Sorry, we could not find the requested series."/>)}

        {selectedSerie && (
          <>
            {serie && (
              <>
                <Group justify="space-between" style={{ alignItems: 'center' }}>
                  <h2 style={{ marginTop: 0, marginBottom: 0 }}>{serie.year} {serie.name}</h2>
                  <div className="mantine-visible-from-sm"><OrganizerBadge
                    organizerAlias={serie.organizerAlias}/>
                  </div>
                </Group>

                <div>
                  <Text size="compact-md">
                    {resultType === 'individual' ? 'Individual Series Results' : `${serie.year} Series Team Results`}
                    {selectedSerieCategory && (
                      <span className="mantine-hidden-from-md">&nbsp;-&nbsp;
                        {selectedSerieCategory?.label}
                  </span>
                    )}
                  </Text>
                </div>

                <div className="mantine-hidden-from-sm" style={{ marginTop: '1rem' }}><OrganizerBadge
                  organizerAlias={serie.organizerAlias}/></div>
              </>
            )}

            <Divider my="md"/>

            {serie && serieStandings && selectedCategory && (
              <>
                <Group style={{ paddingBottom: '1rem' }}>
                  <SearchField value={searchValue} onChange={handleSearchChange}/>

                  <Button
                    variant="default"
                    leftSection={<IconFileDownload/>}
                    onClick={() => handleExportCSV()}
                    data-umami-event="download-event-results-csv"
                    loading={loadingCsv}
                    visibleFrom="sm"
                  >
                    Download CSV
                  </Button>
                </Group>

                {resultType === 'individual' ? (
                  <IndividualRankingsTable
                    serie={serie}
                    selectedCategory={selectedCategory}
                    standings={filteredStandings as AggregatedIndividualRanking[]}
                    eventDates={eventDates}
                  />
                ) : (
                  <TeamRankingsTable
                    serie={serie}
                    selectedCategory={selectedCategory}
                    standings={filteredStandings as AggregatedTeamRanking[]}
                    eventDates={eventDates}
                    onlyShowAggregatedPoints={serieStandings.team?.events.length === 1 && serieStandings.team.events[0].combinedPoints}
                  />
                )}

                <Divider/>

                {!!lastUpdated && (
                  <>
                    <LastUpdated date={lastUpdated}/>

                    <Divider/>
                  </>
                )}

                {!!corrections?.length && (
                  <>
                    <DataCorrections corrections={corrections}/>

                    <Divider/>
                  </>
                )}

                <Source sourceUrls={serieStandings[resultType!]!.sourceUrls}/>
              </>
            )}
          </>)}
      </AppShell.Main>
    </>
  )
}