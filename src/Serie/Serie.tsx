import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { AppContext } from '../AppContext'
import { useParams, useSearchParams } from 'react-router'
import type { AthleteSerieResult, SerieResults, SerieSummary, TeamSerieResult } from '../types/results'
import { AppShell, Text, TextInput, Divider, LoadingOverlay, Group, CloseButton } from '@mantine/core'
import { useCategoryResults } from './utils'
import { fetchSeriesResults } from '../utils/aws-s3'
import { IndividualRankingsTable } from './IndividualRankingsTable/IndividualRankingsTable'
import { Navbar } from './Navbar/Navbar'
import { OrganizerBadge } from '../Event/Shared/OrganizerBadge'
import { TeamRankingsTable } from './TeamRankingsTable/TeamRankingsTable'
import { useEventsAndSeries } from '../utils/useEventsAndSeries'
import { Source } from '../Event/Shared/Source'

export const Serie: React.FC = () => {
  const { series, loading, } = useContext(AppContext)
  const [serieSummary, setSerieSummary] = useState<SerieSummary | null>(null)
  const [seriesResults, setSeriesResults] = useState<SerieResults | null>(null)
  const [searchValue, setSearchValue] = useState('')
  const [loadingResults, setLoadingResults] = useState<boolean>(true)

  const params = useParams<{ resultType: 'individual' | 'team', year: string, hash: string }>()
  const { year, hash, resultType } = params
  const serieYear = +year!
  const serieHash = hash!

  const [searchParams] = useSearchParams()
  const selectedCategory = searchParams.get('category') || serieSummary?.categories[resultType!]?.[0].alias!
  const selectedTeam = searchParams.get('team')

  const selectedSeries = useMemo(() => series.get(serieYear)?.find(({ hash }) => hash === params.hash!), [series, params])

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
      console.log(error)
    } finally {
      setLoadingResults(false)
    }
  }, [setSeriesResults, setLoadingResults])

  useEffect(() => {
    if (series.get(serieYear)) {
      const serieSummary = series.get(serieYear)?.find(({ hash }) => hash === serieHash)
      if (!serieSummary) throw new Error('No series found!')

      setSerieSummary(serieSummary)

      fetchData(serieYear, serieHash)
    }
  }, [serieYear, serieHash, series])

  useEffect(() => {
    if (selectedTeam?.length) setSearchValue(selectedTeam)
  }, [selectedTeam])

  useEffect(() => {
    setSearchValue('')
  }, [selectedCategory])

  const selectedEventCategory = !!selectedCategory && seriesResults?.[resultType!]?.results[selectedCategory] || undefined

  const {
    filteredResults,
  } = useCategoryResults(selectedEventCategory?.results || [], searchValue)

  if (!selectedSeries) {
    return ( 'NO SERIES FOUND' )
  }

  return (
    <>
      <LoadingOverlay visible={loading} loaderProps={{ children: 'Loading series...' }}/>

      {serieSummary && <Navbar serieSummary={serieSummary} selectedCategory={selectedCategory}/>}

      <AppShell.Main>
        <LoadingOverlay visible={loadingResults} loaderProps={{ children: 'Loading results...' }}/>

        {serieSummary && (
          <>
            <Group justify="space-between" style={{ alignItems: 'center' }}>
              <h2 style={{ marginTop: 0, marginBottom: 0 }}>{serieSummary.year} {serieSummary.name}</h2>
              <div className="mantine-visible-from-sm"><OrganizerBadge organizerAlias={serieSummary.organizerAlias}/>
              </div>
            </Group>

            <div>
              <Text
                size="compact-md">{resultType === 'individual' ? 'Individual Series Results' : `${serieSummary.year} Series Team Results`}</Text>
            </div>

            <div className="mantine-hidden-from-sm" style={{ marginTop: '1rem' }}><OrganizerBadge
              organizerAlias={serieSummary.organizerAlias}/></div>
          </>
        )}

        <Divider my="md"/>

        {serieSummary && seriesResults && (
          <>
            <div style={{ paddingBottom: '1rem' }}>
              <TextInput
                placeholder="Search participant name, team, bib number..."
                value={searchValue}
                onChange={(event) => setSearchValue(event.currentTarget.value)}
                rightSection={
                  <CloseButton
                    aria-label="Clear input"
                    onClick={() => setSearchValue('')}
                    style={{ display: searchValue ? undefined : 'none' }}
                  />
                }
              />
            </div>

            {resultType === 'individual' ? (
              <IndividualRankingsTable
                serie={serieSummary}
                selectedCategory={selectedCategory}
                results={filteredResults as AthleteSerieResult[]}
              />
            ) : (
              <TeamRankingsTable
                serie={serieSummary}
                selectedCategory={selectedCategory}
                results={filteredResults as TeamSerieResult[]}
              />
            )}

            <Divider/>

            <Text c="dimmed" size="sm" style={{ padding: '1rem 0' }}>Last
              Updated: {new Date(seriesResults.lastUpdated).toLocaleDateString('en-CA', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })}</Text>

            <Divider/>

            {serieSummary.provider !== 'manual-import' && (
              <Source sourceUrls={seriesResults[resultType!]!.sourceUrls}/>
            )}
          </>
        )}
      </AppShell.Main>
    </>
  )
}