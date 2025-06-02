import { AppShell, Button, NavLink } from '@mantine/core'
import { IconArrowLeft } from '@tabler/icons-react'
import { useNavigate, useSearchParams } from 'react-router'
import type { BaseCategory } from '../../types/results'
import { useContext } from 'react'
import { AppContext } from '../../AppContext'
import { Credit } from '../Shared/Credit'

type NavbarProps = {
  eventYear: number
  eventHash: string
  categories?: BaseCategory[]
  selectedCategory?: string
}

export const Navbar: React.FC<NavbarProps> = ({ eventYear, categories, selectedCategory }) => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { closeNavbar } = useContext(AppContext)

  return (
    <AppShell.Navbar p="md" style={{ paddingBottom: 0 }} className="no-print">
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

      <div style={{ overflowX: 'auto' }}>
        {categories?.map((cat) => (
          <NavLink
            key={cat.alias}
            active={selectedCategory === cat.alias}
            onClick={() => {
              closeNavbar()

              const updatedParams = new URLSearchParams({ category: cat.alias })
              if (searchParams.get('tab')) updatedParams.set('tab', searchParams.get('tab')!)

              setSearchParams(updatedParams)
            }}
            label={cat.label}
          />
        ))}
      </div>

      <Credit/>
    </AppShell.Navbar>
  )
}