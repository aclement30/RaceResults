import { AppShell, Button, NavLink } from '@mantine/core'
import { IconArrowLeft } from '@tabler/icons-react'
import { useNavigate, useSearchParams } from 'react-router'
import type { BaseCategory } from '../../types/results'
import { useContext } from 'react'
import { AppContext } from '../../AppContext'

type NavbarProps = {
  eventYear: number
  eventHash: string
  categories?: BaseCategory[]
  selectedCategory?: string
}

export const Navbar: React.FC<NavbarProps> = ({ eventYear, categories, selectedCategory }) => {
  const navigate = useNavigate()
  const [_, setSearchParams] = useSearchParams()
  const { closeNavbar } = useContext(AppContext)

  return (
    <AppShell.Navbar p="md">
      <Button
        variant="subtle"
        leftSection={<IconArrowLeft size={14}/>}
        style={{ marginBottom: 20 }}
        onClick={() => {
          closeNavbar()
          navigate('/events?year=' + eventYear)
        }}
      >
        Back to events list
      </Button>

      {categories?.map((cat) => (
        <NavLink
          key={cat.alias}
          active={selectedCategory === cat.alias}
          onClick={() => {
            closeNavbar()
            setSearchParams(new URLSearchParams({ category: cat.alias }))
          }}
          label={cat.label}
        />
      ))}
    </AppShell.Navbar>
  )
}