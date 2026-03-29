import { AppShell, Button, NavLink } from '@mantine/core'
import { IconArrowLeft } from '@tabler/icons-react'
import React, { useContext } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import type { BaseCategory } from '../../../shared/types'
import { Credit } from '../../Shared/Credit'
import { UIContext } from '../../UIContext'

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

      {!!categories && (
        <div style={{ overflowX: 'auto' }}>
          {categories?.filter(cat => !cat.parentCategory).map((cat) => {
            const subCategories = categories.filter(subcat => subcat.parentCategory === cat.alias)

            const childSubmenu = subCategories.map((subcat: BaseCategory) => (
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
      )}

      <Credit/>
    </AppShell.Navbar>
  )
}