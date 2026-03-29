import { useNavigate, useParams } from 'react-router'
import { AppShell, Button, NavLink } from '@mantine/core'
import { IconArrowLeft } from '@tabler/icons-react'
import React, { useContext } from 'react'
import { UIContext } from '../../UIContext'
import { Credit } from '../../Shared/Credit'
import type { BaseCategory, Serie } from '../../../shared/types'

type NavbarProps = {
  serie: Serie
  individualCategories?: BaseCategory[]
  teamCategories?: BaseCategory[]
  selectedCategory?: string
}

export const Navbar: React.FC<NavbarProps> = ({
  serie,
  individualCategories,
  teamCategories,
  selectedCategory
}) => {
  const navigate = useNavigate()
  const { closeNavbar } = useContext(UIContext)

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
          navigate('/events?year=' + serie.year + '&series=' + serie.alias)
        }}
        data-umami-event="navigate-back-to-events"
      >
        Back to events list
      </Button>

      <div style={{ overflowX: 'auto' }}>
        {!!teamCategories?.length && (
          <NavLink label={`${serie.year} Series Team Results`}
                   onClick={() => {
                     navigate(`/series/${serie.year}/${serie.hash}/team`)
                   }}
                   defaultOpened={resultType === 'team'}>
            {teamCategories.map((cat) => (
              <NavLink
                key={cat.alias}
                active={resultType === 'team' && selectedCategory === cat.alias}
                onClick={() => {
                  closeNavbar()
                  navigate(`/series/${serie.year}/${serie.hash}/team?category=${cat.alias}`)
                }}
                data-umami-event="select-serie-category"
                data-umami-event-category={cat.alias}
                label={cat.label}
              />
            ))}
          </NavLink>
        )}

        {!!individualCategories?.length && (
          <NavLink label="Individual Series Results"
                   onClick={() => {
                     navigate(`/series/${serie.year}/${serie.hash}/individual`)
                   }}
                   defaultOpened={resultType === 'individual'}>
            {individualCategories.map((cat) => (
              <NavLink
                key={cat.alias}
                active={resultType === 'individual' && selectedCategory === cat.alias}
                onClick={() => {
                  closeNavbar()
                  navigate(`/series/${serie.year}/${serie.hash}/individual?category=${cat.alias}`)
                }}
                data-umami-event="select-serie-category"
                data-umami-event-category={cat.alias}
                label={cat.label}
              />
            ))}
          </NavLink>
        )}
      </div>

      <Credit/>
    </AppShell.Navbar>
  )
}