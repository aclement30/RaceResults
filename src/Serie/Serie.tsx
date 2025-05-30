import { useContext, useEffect, useMemo, useState } from 'react'
import { AppContext } from '../AppContext'
import { useParams, useSearchParams } from 'react-router'
import type { AthleteSerieResult, SerieResults, SerieSummary, TeamSerieResult } from '../types/results'
import { AppShell, Text, TextInput, Divider, LoadingOverlay, Anchor, Group, CloseButton } from '@mantine/core'
import { useCategoryResults } from './utils'
import { fetchEventsAndSeries, fetchSeriesResults, validateYear } from '../utils/aws-s3'
import { IndividualRankingsTable } from './IndividualRankingsTable/IndividualRankingsTable'
import { Navbar } from './Navbar/Navbar'
import { OrganizerBadge } from '../Event/Shared/OrganizerBadge'
import { TeamRankingsTable } from './TeamRankingsTable/TeamRankingsTable'

export const Serie: React.FC = () => {
  const { series, loading, setLoading, setSeries, setEvents } = useContext(AppContext)
  const [serieSummary, setSerieSummary] = useState<SerieSummary | null>(null)
  const [seriesResults, setSeriesResults] = useState<SerieResults | null>(null)
  const [searchValue, setSearchValue] = useState('')
  const [loadingResults, setLoadingResults] = useState<boolean>(true)

  const params = useParams<{ resultType: 'individual' | 'team', year: string, hash: string }>()
  const { year, resultType } = params
  const serieYear = +year!
  const [searchParams] = useSearchParams()
  const selectedCategory = searchParams.get('category') || serieSummary?.categories[resultType!]?.[0].alias
  const selectedTeam = searchParams.get('team')

  const selectedSeries = useMemo(() => series.get(serieYear)?.find(({ hash }) => hash === params.hash!), [series, params])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        if (!validateYear(serieYear)) throw new Error('Invalid year:' + serieYear)

        const { events, series } = await fetchEventsAndSeries(serieYear)

        setEvents(events, serieYear)
        setSeries(series, serieYear)
        setLoading(false)
      } catch (error) {
        console.error(error)
      }
    }

    if (!series.get(serieYear)) {
      fetchData()
    }
  }, [serieYear])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingResults(true)

        const seriesSummary = series.get(serieYear)?.find(({ hash }) => hash === params.hash!)

        if (!seriesSummary) throw new Error('No series found!')

        setSerieSummary(seriesSummary)

        const seriesResults = await fetchSeriesResults(serieYear, params.hash!)

        setSeriesResults(seriesResults)

        setLoadingResults(false)
      } catch (error) {
        console.log(error)
      }
    }

    if (series.get(serieYear)) {
      fetchData()
    }
  }, [params.hash, series])

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

            <Text c="dimmed" size="sm" style={{ padding: '1rem 10px 1rem' }}>Last
              Updated: {new Date(seriesResults.lastUpdated).toLocaleDateString('en-CA', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })}</Text>

            <Divider/>

            {serieSummary.provider !== 'manual-import' && !!seriesResults[resultType!]?.sourceUrls.length && ( <>
              <Text c="dimmed" size="sm" style={{ padding: '10px 10px 0' }}>Source:</Text>
              <ul style={{ listStyle: 'inside', listStyleType: '-', margin: 0, paddingLeft: 10 }}>
                {seriesResults[resultType!]!.sourceUrls!.map((url) =>
                  <li key={url}><Anchor href={url} target="_blank" size="sm">{url}</Anchor>
                  </li>
                )}
              </ul>
            </> )}
          </>
        )}
      </AppShell.Main>
    </>
  )
}