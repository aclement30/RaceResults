import { AppShell, Badge, Burger, Button, Group, useMatches } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { useContext } from 'react'
import { useAuth } from 'react-oidc-context'
import { useNavigate } from 'react-router'
import { UIContext } from '../../UIContext'
import { ENV, LOGOUT_URL } from '../utils/config'

const badgeStyles: React.CSSProperties = {
  fontStyle: 'normal',
  marginLeft: 10,
  position: 'relative',
  top: -5
}

const stageBadge = <Badge color="yellow" variant="outline" style={badgeStyles}>STAGE</Badge>
const productionBadge = <Badge color="red" style={badgeStyles}>PRODUCTION</Badge>

export const AdminHeader = () => {
  const [isSearchOpened] = useDisclosure()
  const { isNavbarOpened, toggleNavbar } = useContext(UIContext)
  const auth = useAuth()
  const navigate = useNavigate()

  const h2Styles = useMatches({
    base: { display: isSearchOpened ? 'none' : 'block' },
    sm: { display: 'block' },
  })

  let envBadge = ENV === 'stage' && stageBadge
  if (ENV === 'production' && window.location.hostname.includes('localhost')) envBadge = productionBadge

  const logoutUser = () => {
    auth.removeUser()
    window.location.href = LOGOUT_URL
  }

  return (
    <AppShell.Header
    >
      <Group h="100%" px="md" style={{ flexWrap: 'nowrap' }}>
        <Burger
          opened={isNavbarOpened}
          onClick={toggleNavbar}
          size="sm"
          data-umami-event="toggle-navbar"
        />

        <Group justify="space-between"
               style={{ flex: '1 1 auto', flexDirection: 'row' }}>
          <h2
            style={{ margin: 0, fontStyle: 'oblique', cursor: 'pointer', ...h2Styles }}
            onClick={() => navigate('/admin')}
            data-umami-event="navigate-admin-dashboard"
          >
            BC Race Results

            <span>
              <span style={{ fontStyle: 'normal', fontWeight: 'lighter' }}> | Admin</span>
              {envBadge}
            </span>
          </h2>

          <Button variant="outline" size="xs" onClick={logoutUser}>Logout</Button>
        </Group>
      </Group>
    </AppShell.Header>
  )
}