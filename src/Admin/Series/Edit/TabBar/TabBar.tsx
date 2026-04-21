import { Tabs } from '@mantine/core'
import React, { useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router'
import type { Serie } from '../../../../../shared/types'

type TabBarProps = {
  year?: number
  serieHash?: string
  serie?: Serie
}

export const TabBar: React.FC<TabBarProps> = ({ year, serieHash, serie }) => {
  const navigate = useNavigate()
  const location = useLocation()

  const selectedTab = useMemo(() => {
    if (location.pathname.includes('standings/individual')) {
      return 'individual-standings'
    } else if (location.pathname.includes('standings/team')) {
      return 'team-standings'
    } else {
      return 'serie-info'
    }
  }, [location.pathname])

  return (
    <Tabs value={selectedTab} keepMounted={false} mb="md">
      <Tabs.List>
        <Tabs.Tab
          value="serie-info"
          onClick={() => serie && navigate(`/admin/series/${year}/${serieHash}`)}>
          Serie Information
        </Tabs.Tab>

        {serie?.types.includes('individual') && (
          <Tabs.Tab
            value="individual-standings"
            disabled={!serie}
            onClick={() => navigate(`/admin/series/${year}/${serieHash}/standings/individual`)}>
            Individual Standings
          </Tabs.Tab>
        )}

        {serie?.types.includes('team') && (
          <Tabs.Tab
            value="team-standings"
            disabled={!serie || true}
            onClick={() => navigate(`/admin/series/${year}/${serieHash}/standings/team`)}>
            Team Standings
          </Tabs.Tab>
        )}
      </Tabs.List>
    </Tabs>
  )
}