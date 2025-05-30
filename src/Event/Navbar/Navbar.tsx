import { AppShell, Button, NavLink } from '@mantine/core'
import { IconArrowLeft } from '@tabler/icons-react'
import { useNavigate, useSearchParams } from 'react-router'
import type { BaseCategory } from '../../types/results'

type NavbarProps = {
  eventYear: number
  eventHash: string
  categories?: BaseCategory[]
  selectedCategory?: string
}

export const Navbar: React.FC<NavbarProps> = ({ eventYear, categories, selectedCategory }) => {
  const navigate = useNavigate()
  const [_, setSearchParams] = useSearchParams()

  return (
    <AppShell.Navbar p="md">
      <Button
        variant="subtle"
        leftSection={<IconArrowLeft size={14}/>}
        style={{ marginBottom: 20 }}
        onClick={() => navigate('/events?year=' + eventYear)}
      >
        Back to events list
      </Button>

      {categories?.map((cat) => (
        <NavLink
          key={cat.alias}
          active={selectedCategory === cat.alias}
          onClick={() => setSearchParams(new URLSearchParams({ category: cat.alias }))}
          label={cat.label}
        />
      ))}
    </AppShell.Navbar>
  )
}