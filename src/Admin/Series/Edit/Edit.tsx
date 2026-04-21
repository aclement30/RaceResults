import React, { useEffect, useMemo, useState } from 'react'
import { Outlet, useOutletContext, useParams } from 'react-router'
import type { BaseSerieEvent, RaceEvent, Serie } from '../../../../shared/types'
import { showErrorMessage } from '../../../utils/showErrorMessage'
import { adminApi } from '../../utils/api'
import type { AdminSerieOutletContext } from '../Series'

export type AdminSerieEditOutletContext = {
  serie?: Serie
  serieEvents: BaseSerieEvent[]
  raceEvents: RaceEvent[]
  onSerieChange: () => void
}

export const AdminSerieEdit: React.FC = () => {
  const params = useParams<{ serieHash: string }>()
  const { events: raceEvents, series, year, onSerieChange } = useOutletContext<AdminSerieOutletContext>()
  const [loading, setLoading] = useState(false)
  const [serieEvents, setSerieEvents] = useState<BaseSerieEvent[]>([])

  const selectedSerie = useMemo(() => {
    if (!params.serieHash) return undefined
    return series.find(s => s.hash === params.serieHash) || undefined
  }, [params.serieHash, year, series])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        const serieEvents = await adminApi.get.serieEvents(year, selectedSerie!.hash, 'individual')

        setSerieEvents(serieEvents)
      } catch (err) {
        showErrorMessage({ title: 'Error', message: (err as Error).message })
      } finally {
        setLoading(false)
      }
    }

    if (selectedSerie) fetchData()
  }, [selectedSerie])

  if (params.serieHash && (!selectedSerie || loading)) return null

  return (
    <Outlet context={{ serie: selectedSerie, serieEvents, raceEvents, onSerieChange }}/>
  )
}
