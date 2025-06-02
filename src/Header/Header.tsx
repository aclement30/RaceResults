import { AppShell, Burger, Group } from '@mantine/core'
import { useNavigate } from 'react-router'
import { useContext } from 'react'
import { AppContext } from '../AppContext'

export const Header = () => {
  const navigate = useNavigate()
  const { isNavbarOpened, toggleNavbar } = useContext(AppContext)
  return (
    <AppShell.Header
      style={{
        backgroundImage: 'url(/header-bg.png)',
        backgroundPosition: 'top right',
        backgroundRepeat: 'no-repeat',
      }}>
      <Group h="100%" px="md">
        <Burger
          opened={isNavbarOpened}
          onClick={toggleNavbar}
          hiddenFrom="md"
          size="sm"
        />

        <h2 style={{ margin: 0, fontStyle: 'oblique', cursor: 'pointer' }} onClick={() => navigate('events')}>
          BC Race Results
        </h2>
      </Group>
    </AppShell.Header>
  )
}