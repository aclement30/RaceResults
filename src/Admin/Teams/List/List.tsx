import { Button, Divider, Group, LoadingOverlay } from '@mantine/core'
import { IconPlus } from '@tabler/icons-react'
import { useNavigate } from 'react-router'
import { Loader } from '../../../Loader/Loader'
import type { Team, TeamRoster } from '../../../../shared/types'
import { TeamsTable } from '../TeamsTable/TeamsTable'

type AdminTeamListProps = {
  teams: Team[]
  teamRosters: TeamRoster[]
  loading: boolean
  onChange: () => void
}

export const AdminTeamList: React.FC<AdminTeamListProps> = ({ teams, teamRosters, loading, onChange }) => {
  const navigate = useNavigate()

  return (
    <>
      <Group justify="space-between" style={{ alignItems: 'flex-start' }}>
        <div>
          <Group gap={5} style={{ alignItems: 'center' }}>
            <h2 style={{ marginTop: 0, marginBottom: 0 }}>Teams</h2>
          </Group>
        </div>

        <Button leftSection={<IconPlus/>} onClick={() => navigate('/admin/teams/new')}>Add Team</Button>
      </Group>

      <Divider my="md"/>

      <LoadingOverlay
        visible={loading} overlayProps={{ radius: 'sm', blur: 2 }}
        loaderProps={{
          children: <Loader text="Loading data..."/>,
        }}
      />

      <TeamsTable teams={teams} teamRosters={teamRosters} onChange={onChange}/>
    </>
  )
}