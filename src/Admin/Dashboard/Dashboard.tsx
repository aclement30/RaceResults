import { AppShell, Button } from '@mantine/core'
import { IconCaretDown } from '@tabler/icons-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import type { RaceEvent, Serie } from '../../../shared/types'
import { showErrorMessage } from '../../utils/showErrorMessage'
import { AdminEventList } from '../Events/List/List'
import { AdminNavbar } from '../Navbar/Navbar'
import { AdminSerieList } from '../Series/List/List'
import { adminApi } from '../utils/api'

const CURRENT_YEAR = new Date().getFullYear()

export const AdminDashboard = () => {
  const [loadingData, setLoadingData] = useState<boolean>(true)
  const [events, setEvents] = useState<RaceEvent[]>([])
  const [series, setSeries] = useState<Serie[]>([])
  const navigate = useNavigate()

  const fetchData = async () => {
    try {
      setLoadingData(true)

      const [
        yearEvents,
        yearSeries,
      ] = await Promise.all([
        adminApi.get.events({ year: +CURRENT_YEAR }),
        adminApi.get.series({ year: +CURRENT_YEAR }),
      ])

      // Only keep last 5 events
      const lastEvents = yearEvents.sort((a, b) => a.date.localeCompare(b.date)).reverse().slice(0, 5)

      setEvents(lastEvents)
      setSeries(yearSeries)
    } catch (error) {
      showErrorMessage({ title: 'Error', message: (error as any).message })

      setEvents([])
      setSeries([])
    } finally {
      setLoadingData(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  return (
    <>
      <AdminNavbar/>

      <AppShell.Main style={{
        backgroundPosition: 'top 60px right',
        backgroundRepeat: 'no-repeat',
      }}>
        <AdminEventList title="Latest Events" showSearch={false} events={events} series={series}
                        loading={loadingData}/>
        <Button
          fullWidth
          variant="subtle"
          mt="sm"
          mb="lg"
          leftSection={<IconCaretDown/>}
          onClick={() => navigate('/admin/events')}
        >
          View all events
        </Button>

        <AdminSerieList series={series} events={events} year={CURRENT_YEAR}/>
      </AppShell.Main>
    </>
  )
}