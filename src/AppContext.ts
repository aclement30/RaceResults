import { createContext } from 'react'
import type { EventSummary, SerieSummary } from './types/results'

export const AppContext = createContext({
  years: [] as number[],
  setYears: (_: number[]) => {
  },
  events: new Map<number, EventSummary[]>(),
  setEvents: (_: EventSummary[], __: number) => {
  },
  series: new Map<number, SerieSummary[]>(),
  setSeries: (_: SerieSummary[], __: number) => {
  },
  loading: true,
  setLoading: (_: boolean) => {
  },
  isNavbarOpened: false,
  toggleNavbar: () => {
  },
  closeNavbar: () => {
  }
})

// type AppContextProviderProps = {
//   children: ReactNode
// }
//
// export const AppContextProvider: React.FC<AppContextProviderProps> = ({ children }) => {
//   const [years, setYears] = useState<number[]>([])
//   const [events, setEvents] = useState<Map<number, BaseEvent[]>>({} as Map<number, BaseEvent[]>)
//   const [files, setFiles] = useState<GroupedEventFile[]>([])
//   const [loading, setLoading] = useState<boolean>(true)
//
//   const setEventsForYear = async (events: BaseEvent[], year: number) => {
//     setEvents((prevState) => ( { ...prevState, [year]: events } ))
//   }
//
//   const value = { years, setYears, events, setEventsForYear, files, setFiles, loading, setLoading }
//
//   return (
//     <AppContext.Provider value={value}>
//       {children}
//     </AppContext.Provider>
//   )
// }