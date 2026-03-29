import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { AppContext } from '../AppContext'
import { useParams, useSearchParams } from 'react-router'
import { AppShell, Text, Divider, LoadingOverlay, Group, Blockquote } from '@mantine/core'
import { useCategoryResults } from './utils'
import { FETCH_ERROR_TYPE, FetchError, fetchSeriesResults } from '../utils/aws-s3'
import { IndividualRankingsTable } from './IndividualRankingsTable/IndividualRankingsTable'
import { Navbar } from './Navbar/Navbar'
import { OrganizerBadge } from '../Shared/OrganizerBadge'
import { TeamRankingsTable } from './TeamRankingsTable/TeamRankingsTable'
import { useEventsAndSeries } from '../utils/useEventsAndSeries'
import { Source } from '../Shared/Source'
import { SearchField } from '../Shared/SearchField'
import { ResourceNotFound } from '../Shared/ResourceNotFound'
import { showErrorMessage } from '../utils/showErrorMessage'
import { IconHelp } from '@tabler/icons-react'
import { UIContext } from '../UIContext'
// import { FeedbackWidget } from '../Shared/FeedbackWidget/FeedbackWidget'
import debounce from 'lodash/debounce'
import type { SerieResults, Serie as TSerie, ParticipantSerieResult, TeamSerieResult } from '../../shared/types'

export const Serie: React.FC = () => {
  const { series } = useContext(AppContext)
  const { loading } = useContext(UIContext)
  const [serie, setSerie] = useState<TSerie | null>(null)
  const [seriesResults, setSeriesResults] = useState<SerieResults | null>(null)
  const [searchValue, setSearchValue] = useState('')
  const [loadingResults, setLoadingResults] = useState<boolean>(true)

  const params = useParams<{ resultType: 'individual' | 'team', year: string, hash: string }>()
  const { year, hash, resultType } = params
  const serieYear = +year!
  const serieHash = hash!

  const [searchParams] = useSearchParams()
  const selectedCategory = searchParams.get('category') || seriesResults?.[resultType!]?.categories?.[0].alias
  const selectedTeam = searchParams.get('team')

  const selectedSeries = useMemo(() => series.get(serieYear)?.find(({ hash }) => hash === params.hash!), [
    series,
    params
  ])

  useEventsAndSeries(serieYear)

  const fetchData = useCallback(async (year: number, hash: string) => {
    try {
      setLoadingResults(true)

      console.log(`Fetching serie results for: ${year}/${hash}`)

      const {
        serieResults,
      } = await fetchSeriesResults(year, hash)

      setSeriesResults(serieResults)
    } catch (error) {
      if (error instanceof FetchError && error.type === FETCH_ERROR_TYPE.NotFound) {
        // Show a Resource Not Found error instead of the error message
      } else {
        showErrorMessage({ title: 'Error', message: (error as any).message })
      }
    } finally {
      setLoadingResults(false)
    }
  }, [setSeriesResults, setLoadingResults])

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

  const selectedSerieCategory = useMemo(() => selectedCategory ? seriesResults?.[resultType!]?.categories.find(c => c.alias === selectedCategory) : undefined, [
    selectedCategory,
    seriesResults,
    resultType
  ])

  const {
    filteredResults,
  } = useCategoryResults(selectedSerieCategory?.results || [], searchValue)

  return (
    <>
      <LoadingOverlay visible={loading} loaderProps={{ children: 'Loading series...' }}/>

      {serie &&
        <Navbar serie={serie} teamCategories={seriesResults?.team?.categories}
                individualCategories={seriesResults?.individual?.categories} selectedCategory={selectedCategory}/>}

      <AppShell.Main>
        <LoadingOverlay visible={loadingResults} loaderProps={{ children: 'Loading results...' }}/>

        {!selectedSeries && !loadingResults && (
          <ResourceNotFound title="Series Not Found" text="Sorry, we could not find the requested series."/>)}

        {selectedSeries && (
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

            {serie && seriesResults && selectedCategory && (
              <>
                <div style={{ paddingBottom: '1rem' }}>
                  <SearchField value={searchValue} onChange={handleSearchChange}/>
                </div>

                {resultType === 'individual' ? (
                  <IndividualRankingsTable
                    serie={serie}
                    selectedCategory={selectedCategory}
                    results={filteredResults as ParticipantSerieResult[]}
                  />
                ) : (
                  <TeamRankingsTable
                    serie={serie}
                    selectedCategory={selectedCategory}
                    results={filteredResults as TeamSerieResult[]}
                  />
                )}

                <Divider/>

                {!!selectedSerieCategory?.updatedAt && (
                  <Group justify="space-between">
                    <Text c="dimmed" size="sm" style={{ padding: '1rem 0' }}>Last
                      Updated: {new Date(selectedSerieCategory.updatedAt).toLocaleDateString('en-CA', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}</Text>

                    {/*<FeedbackWidget/>*/}
                  </Group>
                )}

                <Divider/>

                {selectedSerieCategory?.corrections?.length && (
                  <>
                    <Blockquote color="yellow" mt="lg" p="md">
                      <Group justify="space-between" style={{ marginBottom: '0.5rem' }}>
                        <h5 style={{ margin: 0 }}>Data Corrections</h5>
                        <Text size="xs" c="dimmed"><IconHelp size="14"
                                                             style={{ verticalAlign: 'text-bottom' }}/> Changes from the
                          original source</Text>
                      </Group>
                      <div
                        dangerouslySetInnerHTML={{ __html: selectedSerieCategory?.corrections.replace(/\n/g, '<br />') }}
                        style={{ fontSize: 'smaller' }}/>
                    </Blockquote>

                    <Divider/>
                  </>
                )}

                <Source sourceUrls={seriesResults[resultType!]!.sourceUrls}/>
              </>
            )}
          </>)}
      </AppShell.Main>
    </>
  )
}