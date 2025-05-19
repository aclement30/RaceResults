import {useContext, useEffect, useMemo, useState} from 'react'
import { AppContext } from '../AppContext'
import {useNavigate, useParams} from 'react-router'
import { getEventResults } from '../utils/race-results'
import type {EventResult} from '../types/results.ts'
import {CategoryResultsTable} from './CategoryResultsTable/CategoryResultsTable.tsx'
import { Tabs, TextInput } from '@mantine/core'


export const Event: React.FC = () => {
  const { events, files: allFiles } = useContext(AppContext)
  const [eventResults, setEventResults] = useState<EventResult | null>(null)
  const [searchValue, setSearchValue] = useState('')

  const params = useParams()
  const { selectedCategory } = params
  const navigate = useNavigate()

  const selectedEventKey = `${params.year}/${params.organizer}/${params.eventName}`
  const selectedEvent = useMemo(() => events.find(({ key }) => key === selectedEventKey), [events, params])
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const shapedEventResults = await getEventResults({
          date: params.year!,
          organizer: params.organizer!,
          eventName: params.eventName!
        }, allFiles)

        setEventResults(shapedEventResults)
      } catch (error) {
        console.log(error)
      }
    }

    fetchData()
  }, [selectedEventKey])

  const handleTabChange = (selectedTab: string | null) => {
    navigate(`/event/${selectedEventKey}/${selectedTab}`)
  }

  if (!selectedEvent) {
    return ( 'NO EVENT FOUND' )
  }

  return (
    <>
      <h2 style={{ marginTop: 0 }}>{selectedEvent.name}</h2>

      {eventResults && (
        <Tabs color="teal" defaultValue="first" value={selectedCategory} orientation="vertical" onChange={handleTabChange}>
          <Tabs.List>
            {eventResults.categories.sort((a, b) => a.label < b.label ? -1 : 1).map((cat) => (
              <Tabs.Tab value={cat.alias}>{cat.label}</Tabs.Tab>
            ))}
          </Tabs.List>

          {eventResults.categories.map((cat) => (
            <Tabs.Panel value={cat.alias} key={cat.alias}>
              <div style={{ padding: 10}}>
                <TextInput
                  placeholder="Search participant name, team, bib number..."
                  value={searchValue}
                  onChange={(event) => setSearchValue(event.currentTarget.value)}
                />
              </div>

              <CategoryResultsTable event={selectedEvent} results={eventResults} categoryAlias={cat.alias} searchValue={searchValue} />
            </Tabs.Panel>
          ))}
        </Tabs>
      )}
    </>
  )
}