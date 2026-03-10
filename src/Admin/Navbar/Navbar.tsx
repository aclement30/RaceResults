import { AppShell, Divider, NavLink } from '@mantine/core'
import { useLocation, useNavigate } from 'react-router'
import { useContext } from 'react'
import { Credit } from '../../Shared/Credit'
import { UIContext } from '../../UIContext'
import { RequireAdmin } from '../Shared/RequireAdmin/RequireAdmin'

export const AdminNavbar: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { closeNavbar } = useContext(UIContext)

  const isActive = (
    path: string,
    exact?: boolean
  ) => exact ? location.pathname === path : location.pathname.startsWith(path)

  return (
    <AppShell.Navbar p="md">
      <RequireAdmin>
        <NavLink
          onClick={() => {
            closeNavbar()
            navigate(`/admin/athletes`)
          }}
          active={isActive('/admin/athletes')}
          label="Athletes"
        />

        <NavLink
          onClick={() => {
            closeNavbar()
            navigate(`/admin/teams`)
          }}
          active={isActive('/admin/teams')}
          label="Teams"
        />

        <NavLink
          onClick={() => {
            closeNavbar()
            navigate(`/admin/data-processing`)
          }}
          active={isActive('/admin/data-processing')}
          label="Data Processing"
        />

        <NavLink
          onClick={() => {
            closeNavbar()
            navigate(`/admin/settings`)
          }}
          active={isActive('/admin/settings', true)}
          label="Settings"
          defaultOpened
        >
          <NavLink
            onClick={() => {
              closeNavbar()
              navigate('/admin/settings/config-files')
            }}
            label="Configuration Files"
            active={isActive('/admin/settings/config-files')}
          />
        </NavLink>
        <Divider style={{ marginBottom: '1rem' }}/>
      </RequireAdmin>

      <NavLink
        onClick={() => {
          closeNavbar()
          navigate(`/admin/events`)
        }}
        active={isActive('/admin/events')}
        label="Events"
      />

      <Credit/>
    </AppShell.Navbar>
  )
}