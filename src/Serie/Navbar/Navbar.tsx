import type { SerieSummary } from '../../types/results'
import { useNavigate, useParams } from 'react-router'
import { AppShell, Button, NavLink } from '@mantine/core'
import { IconArrowLeft } from '@tabler/icons-react'

type NavbarProps = {
  serieSummary: SerieSummary
  selectedCategory?: string
}

export const Navbar: React.FC<NavbarProps> = ({ serieSummary, selectedCategory }) => {
  const navigate = useNavigate()

  const params = useParams<{ resultType: 'individual' | 'team' }>()
  const { resultType } = params

  return (
    <AppShell.Navbar p="md">
      <Button
        variant="subtle"
        leftSection={<IconArrowLeft size={14}/>}
        style={{ marginBottom: 20 }}
        onClick={() => navigate('/events?year=' + serieSummary.year + '&series=' + serieSummary.alias)}
      >
        Back to events list
      </Button>

      {!!serieSummary.categories.team?.length && (
        <NavLink label={`${serieSummary.year} Series Team Results`}
                 onClick={() => navigate(`/series/${serieSummary.year}/${serieSummary.hash}/team`)}
                 defaultOpened={resultType === 'team'}>
          {serieSummary.categories.team.map((cat) => (
            <NavLink
              key={cat.alias}
              active={resultType === 'team' && selectedCategory === cat.alias}
              onClick={() => navigate(`/series/${serieSummary.year}/${serieSummary.hash}/team?category=${cat.alias}`)}
              label={cat.label}
            />
          ))}
        </NavLink>
      )}

      {!!serieSummary.categories.individual?.length && (
        <NavLink label="Individual Series Results"
                 onClick={() => navigate(`/series/${serieSummary.year}/${serieSummary.hash}/individual`)}
                 defaultOpened={resultType === 'individual'}>
          {serieSummary.categories.individual.map((cat) => (
            <NavLink
              key={cat.alias}
              active={resultType === 'individual' && selectedCategory === cat.alias}
              onClick={() => navigate(`/series/${serieSummary.year}/${serieSummary.hash}/individual?category=${cat.alias}`)}
              label={cat.label}
            />
          ))}
        </NavLink>
      )}
    </AppShell.Navbar>
  )
}