import { useCallback, useContext, useEffect, useRef } from 'react'
import { FETCH_ERROR_TYPE, FetchError, fetchEvents, fetchSeries, validateYear } from './aws-s3'
import { notifications } from '@mantine/notifications'
import { AppContext } from '../AppContext'
import type { EventSummary, SerieSummary } from '../types/results'
import { UIContext } from '../UIContext'

export const useEventsAndSeries = (year: number) => {
  const { setLoading } = useContext(UIContext)
  const { events, series, setEvents, setSeries } = useContext(AppContext)
  const eventsRef = useRef<{ events: typeof events, lastModified: Map<number, Date | null> }>({
    events,
    lastModified: new Map<number, Date | null>()
  })
  const seriesRef = useRef<{ series: typeof series, lastModified: Map<number, Date | null> }>({
    series,
    lastModified: new Map<number, Date | null>()
  })
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Update local events state when events change
  useEffect(() => {
    eventsRef.current = { events, lastModified: eventsRef.current.lastModified }
  }, [events])

  // Update local series state when series change
  useEffect(() => {
    seriesRef.current = { series, lastModified: seriesRef.current.lastModified }
  }, [series])

  const fetchData = useCallback(async (year: number) => {
    try {
      setLoading(true)

      console.log('Fetching events & series for year:', year)

      const fetchResponses = await Promise.allSettled([
        fetchEvents(year, eventsRef.current.lastModified.get(year) || null),
        fetchSeries(year, seriesRef.current.lastModified.get(year) || null),
      ])

      fetchResponses.forEach((response, index) => {
        if (response.status === 'fulfilled') {
          if (index === 0) {
            setEvents((response.value as { events: EventSummary[] }).events, year)
            eventsRef.current.lastModified.set(year, response.value.lastModified)
          } else if (index === 1) {
            setSeries((response.value as { series: SerieSummary[] }).series, year)
            seriesRef.current.lastModified.set(year, response.value.lastModified)
          }
        } else {
          if (response.reason instanceof FetchError && response.reason.type === FETCH_ERROR_TYPE.NotModified) {
            // If the file is not modified, we can skip updating
            return
          }

          notifications.show({
            title: 'Error',
            message: `An error occurred while fetching data: ${response.reason.message}`,
          })
        }
      })
    } catch (error) {
      notifications.show({
        title: 'Error',
        // @ts-ignore
        message: `An error occurred while fetching data: ${error.message}`,
      })
    } finally {
      setLoading(false)
    }

    if (timerRef.current) clearTimeout(timerRef.current)

    timerRef.current = setTimeout(() => {
      fetchData(year)
    }, 1000 * 60 * 5) // Refresh every 5 minutes
  }, [setLoading, setEvents, setSeries])

  // Fetch data when the year changes
  useEffect(() => {
    if (!validateYear(year)) throw new Error('Invalid year:' + year)

    fetchData(year)
  }, [year])

  // Cleanup timer on unmount
  useEffect(() => {
    return function cleanup() {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])
}