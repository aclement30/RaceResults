import { useContext, useEffect, useMemo } from 'react'
import { AppContext } from '../AppContext'
import { useParams } from 'react-router'
import { getEventResults } from '../utils/race-results'

type EventProps = {}
export const Event: React.FC<EventProps> = () => {
  const { events, files: allFiles } = useContext(AppContext)
  const params = useParams()

  const selectedEventKey = `${params.year}/${params.organizer}/${params.eventName}`
  const selectedEvent = useMemo(() => events.find(({ key }) => key === selectedEventKey), [events, params])
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        await getEventResults({
          date: params.year!,
          organizer: params.organizer!,
          eventName: params.eventName!
        }, allFiles)
      } catch (error) {
        console.log(error)
      }
    }

    fetchData()
  }, [selectedEventKey])

  if (!selectedEvent) {
    return ( 'NO EVENT FOUND' )
  }

  return (
    <>
      <h2 style={{ marginTop: 0 }}>{selectedEvent.name}</h2>
    </>
  )
}