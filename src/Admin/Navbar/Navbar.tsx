import { AppShell, Divider, NavLink } from '@mantine/core'
import { useContext } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router'
import { Credit } from '../../Shared/Credit'
import { UIContext } from '../../UIContext'
import { AdminContext } from '../Shared/AdminContext'
import { RequireAdmin } from '../Shared/RequireAdmin/RequireAdmin'

export const AdminNavbar: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { closeNavbar } = useContext(UIContext)
  const { years: eventYears } = useContext(AdminContext)
  const [searchParams] = useSearchParams()

  const isActive = (
    { path, query }: {
      path: string;
      query?: Record<string, string | number> | null;
    },
    exact?: boolean
  ) => {
    if (query !== undefined) {
      // If query is null, we want to check that there are no query parameters in the URL
      if (query === null && Array.from(searchParams.keys()).length !== 0) return false

      // Check that all query parameters in the provided query object match the current URL's search parameters
      if (query) {
        const queryEntries = Object.entries(query)
        const hasMatchingQuery = queryEntries.every(([key, value]) => searchParams.get(key) === value.toString())
        if (!hasMatchingQuery) return false
      }
    }

    return exact ? location.pathname === path : location.pathname.startsWith(path)
  }

  return (
    <AppShell.Navbar p="md">
      <RequireAdmin>
        <NavLink
          onClick={() => {
            closeNavbar()
            navigate(`/admin/athletes`)
          }}
          active={isActive({ path: '/admin/athletes' })}
          label="Athletes"
        />

        <NavLink
          onClick={() => {
            closeNavbar()
            navigate(`/admin/teams`)
          }}
          active={isActive({ path: '/admin/teams' })}
          label="Teams"
        />

        <NavLink
          onClick={() => {
            closeNavbar()
            navigate(`/admin/data-processing`)
          }}
          active={isActive({ path: '/admin/data-processing' })}
          label="Data Processing"
        />

        <NavLink
          onClick={() => {
            closeNavbar()
            navigate(`/admin/settings`)
          }}
          active={isActive({ path: '/admin/settings' }, true)}
          label="Settings"
          defaultOpened
        >
          <NavLink
            onClick={() => {
              closeNavbar()
              navigate('/admin/settings/config-files')
            }}
            label="Configuration Files"
            active={isActive({ path: '/admin/settings/config-files' })}
          />
        </NavLink>
        <Divider style={{ marginBottom: '1rem' }}/>
      </RequireAdmin>

      <NavLink
        onClick={() => {
          navigate(`/admin/events`)
        }}
        active={isActive({ path: '/admin/events', query: null }, true)}
        opened={isActive({ path: '/admin/events' })}
        label="Events"
      >
        {eventYears.map(year => (
          <NavLink
            key={year}
            onClick={() => {
              closeNavbar()
              navigate(`/admin/events?year=${year}`)
            }}
            label={year}
            active={isActive({
              path: `/admin/events`,
              query: { year }
            }, true) || isActive({ path: `/admin/events/${year}` })}
          />
        ))}
      </NavLink>

      <NavLink
        onClick={() => {
          navigate(`/admin/series`)
        }}
        active={isActive({ path: '/admin/series', query: null }, true)}
        opened={isActive({ path: '/admin/series' })}
        label="Series"
      >
        {eventYears.map(year => (
          <NavLink
            key={year}
            onClick={() => {
              closeNavbar()
              navigate(`/admin/series?year=${year}`)
            }}
            label={year}
            active={isActive({
              path: `/admin/series`,
              query: { year }
            }, true) || isActive({ path: `/admin/series/${year}` })}
          />
        ))}
      </NavLink>

      <Credit/>
    </AppShell.Navbar>
  )
}