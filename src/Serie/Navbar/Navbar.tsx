import type { SerieSummary } from '../../types/results'
import { useNavigate, useParams } from 'react-router'
import { AppShell, Button, NavLink } from '@mantine/core'
import { IconArrowLeft } from '@tabler/icons-react'
import { useContext } from 'react'
import { AppContext } from '../../AppContext'

type NavbarProps = {
  serieSummary: SerieSummary
  selectedCategory?: string
}

export const Navbar: React.FC<NavbarProps> = ({ serieSummary, selectedCategory }) => {
  const navigate = useNavigate()
  const { closeNavbar } = useContext(AppContext)

  const params = useParams<{ resultType: 'individual' | 'team' }>()
  const { resultType } = params

  return (
    <AppShell.Navbar p="md" style={{ paddingBottom: 0 }}>
      <Button
        variant="subtle"
        leftSection={<IconArrowLeft size={14}/>}
        style={{ marginBottom: 20, flex: '0 0 auto' }}
        onClick={() => {
          closeNavbar()
          navigate('/events?year=' + serieSummary.year + '&series=' + serieSummary.alias)
        }}
      >
        Back to events list
      </Button>

      <div style={{ overflowX: 'auto' }}>
        {!!serieSummary.categories.team?.length && (
          <NavLink label={`${serieSummary.year} Series Team Results`}
                   onClick={() => {
                     navigate(`/series/${serieSummary.year}/${serieSummary.hash}/team`)
                   }}
                   defaultOpened={resultType === 'team'}>
            {serieSummary.categories.team.map((cat) => (
              <NavLink
                key={cat.alias}
                active={resultType === 'team' && selectedCategory === cat.alias}
                onClick={() => {
                  closeNavbar()
                  navigate(`/series/${serieSummary.year}/${serieSummary.hash}/team?category=${cat.alias}`)
                }}
                label={cat.label}
              />
            ))}
          </NavLink>
        )}

        {!!serieSummary.categories.individual?.length && (
          <NavLink label="Individual Series Results"
                   onClick={() => {
                     navigate(`/series/${serieSummary.year}/${serieSummary.hash}/individual`)
                   }}
                   defaultOpened={resultType === 'individual'}>
            {serieSummary.categories.individual.map((cat) => (
              <NavLink
                key={cat.alias}
                active={resultType === 'individual' && selectedCategory === cat.alias}
                onClick={() => {
                  closeNavbar()
                  navigate(`/series/${serieSummary.year}/${serieSummary.hash}/individual?category=${cat.alias}`)
                }}
                label={cat.label}
              />
            ))}
          </NavLink>
        )}
      </div>
    </AppShell.Navbar>
  )
}