import { AppShell, Button, NavLink } from '@mantine/core'
import { IconArrowLeft } from '@tabler/icons-react'
import { useNavigate, useSearchParams } from 'react-router'
import type { BaseCategory } from '../../types/results'
import { useContext } from 'react'
import { UIContext } from '../../UIContext'
import { Credit } from '../../Shared/Credit'

type NavbarProps = {
  eventYear: number
  eventHash: string
  categories?: BaseCategory[]
  selectedCategory?: string
}

export const Navbar: React.FC<NavbarProps> = ({ eventYear, categories, selectedCategory }) => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { closeNavbar } = useContext(UIContext)

  const handleSelectCategory = (categoryAlias: string) => {
    closeNavbar()

    const updatedParams = new URLSearchParams({ category: categoryAlias })
    if (searchParams.get('tab')) updatedParams.set('tab', searchParams.get('tab')!)

    setSearchParams(updatedParams)
  }

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
        data-umami-event="navigate-back-to-events"
      >
        Back to events list
      </Button>

      <div style={{ overflowX: 'auto' }}>
        {categories?.filter(cat => !cat.umbrellaCategory).map((cat) => {
          const combinedCategories = cat.combinedCategories?.length ? categories.filter(subcat => cat.combinedCategories!.includes(subcat.alias)) : []
          const childSubmenu = combinedCategories.map((subcat: BaseCategory) => (
            <NavLink
              key={subcat.alias}
              active={selectedCategory === subcat.alias}
              onClick={() => handleSelectCategory(subcat.alias)}
              data-umami-event="select-event-category"
              data-umami-event-category={subcat.alias}
              label={subcat.label}
            />
          ))

          return (
            <NavLink
              key={cat.alias}
              active={selectedCategory === cat.alias}
              onClick={() => handleSelectCategory(cat.alias)}
              data-umami-event="select-event-category"
              data-umami-event-category={cat.alias}
              label={cat.label}
              defaultOpened={!!childSubmenu.length}
              opened={!!childSubmenu.length}
            >
              {childSubmenu.length ? childSubmenu : null}
            </NavLink>
          )
        })}
      </div>

      <Credit/>
    </AppShell.Navbar>
  )
}