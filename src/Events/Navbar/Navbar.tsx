import { AppShell, Divider, NavLink } from '@mantine/core'
import { useNavigate } from 'react-router'
import { useContext, useMemo } from 'react'
import { AppContext } from '../../AppContext'
import { Credit } from '../../Shared/Credit'
import { getSerieLabel } from '../../Event/utils'

type NavbarProps = {
  filters: {
    year: number
    serie: string | null
  }
}

export const Navbar: React.FC<NavbarProps> = ({ filters }) => {
  const navigate = useNavigate()
  const { events, series, years, closeNavbar } = useContext(AppContext)

  const seriesSummaries = series.get(filters.year) || []

  // List of series from events of the selected year (not actual series standings)
  const yearSeriesFilters = useMemo(() => {
    const yearEvents = events.get(filters.year)?.filter(({ year }) => year === filters.year) || []

    return [...new Set(yearEvents.map(({ serie }) => serie).filter(Boolean) || [])]
  }, [filters.year, events])

  const yearSeriesWithNoEvents = useMemo(() => {
    return seriesSummaries.filter((serieSummary) => !yearSeriesFilters.includes(serieSummary.alias)).map((serieSummary) => serieSummary.alias)
  }, [yearSeriesFilters, seriesSummaries])

  return (
    <AppShell.Navbar p="md">
      {years.map((year) => (
        <NavLink
          key={year}
          onClick={() => {
            closeNavbar()
            navigate(`/events?year=${year}`)
          }}
          active={year === filters.year}
          label={year}
        />))}

      <Divider style={{ marginBottom: '1rem' }}/>

      <NavLink
        onClick={() => {
          closeNavbar()
          navigate(`/events?year=${filters.year}`)
        }}
        active={!filters.serie}
        label="All Events"
      />

      {[...yearSeriesFilters, ...yearSeriesWithNoEvents].map((serieAlias) => {
        const matchingSerie = seriesSummaries.find((serieSummary) => serieSummary.alias === serieAlias)

        return (
          <NavLink
            key={serieAlias}
            onClick={() => {
              closeNavbar()
              navigate(`/events?year=${filters.year}&series=${serieAlias}`)
            }}
            active={serieAlias === filters.serie}
            label={matchingSerie?.name || getSerieLabel(serieAlias)}
          />)
      })}

      <Credit/>
    </AppShell.Navbar>
  )
}