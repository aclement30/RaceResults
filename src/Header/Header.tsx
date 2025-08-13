import {
  ActionIcon,
  AppShell,
  Burger,
  Button,
  Group,
  Tooltip,
  useMatches
} from '@mantine/core'
import { useContext } from 'react'
import { UIContext } from '../UIContext'
import { IconUserSearch } from '@tabler/icons-react'
import { useDisclosure } from '@mantine/hooks'
import { AthleteSearchField } from '../Shared/AthleteSearchField'
import { useNavigator } from '../utils/useNavigator'

export const Header = () => {
  const [isSearchOpened, { toggle }] = useDisclosure()
  const { navigateToAthlete, navigateToEvents } = useNavigator()
  const { isNavbarOpened, toggleNavbar } = useContext(UIContext)

  const h2Styles = useMatches({
    base: { display: isSearchOpened ? 'none' : 'block' },
    sm: { display: 'block' },
  })

  const handleSelectAthlete = (athleteUciId: string) => {
    toggle()
    navigateToAthlete(athleteUciId)
    window.umami?.track('select-athlete-from-header-search', { athleteUciId })
  }

  return (
    <AppShell.Header
    >
      <Group h="100%" px="md" style={{ flexWrap: 'nowrap' }}>
        <Burger
          opened={isNavbarOpened}
          onClick={toggleNavbar}
          hiddenFrom="md"
          size="sm"
          data-umami-event="toggle-navbar"
        />

        <Group justify="space-between"
               style={{ flex: '1 1 auto', flexDirection: 'row' }}>
          <h2
            style={{ margin: 0, fontStyle: 'oblique', cursor: 'pointer', ...h2Styles }}
            onClick={navigateToEvents}
            data-umami-event="navigate-home"
          >
            BC Race Results
          </h2>

          <Tooltip label="Search athletes" position="left" withArrow>
            <ActionIcon variant="subtle" aria-label="Settings" radius="50%"
                        style={{ padding: 5, display: isSearchOpened ? 'none' : 'inline-flex' }} size="xl"
                        onClick={toggle}
                        data-umami-event="toggle-athlete-search">
              <IconUserSearch/>
            </ActionIcon>
          </Tooltip>

          {isSearchOpened && (
            <div
              style={{
                display: 'flex',
                flex: '1 1 auto',
                alignItems: 'center',
                gap: '0.5rem',
                maxWidth: 400
              }}>
              <AthleteSearchField autoFocus={true} onSelect={handleSelectAthlete}/>

              <Button variant="transparent" size="xs" onClick={() => {
                toggle()
              }} px="0" style={{ flex: '0 0 auto' }}>
                Cancel
              </Button>
            </div>
          )}
        </Group>
      </Group>
    </AppShell.Header>
  )
}