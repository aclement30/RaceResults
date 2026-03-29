import { Divider, Group, LoadingOverlay } from '@mantine/core'
import React from 'react'
import type { Athlete } from '../../../../shared/types'
import { Loader } from '../../../Loader/Loader'
import { AthletesTable } from '../AthletesTable/AthletesTable'

type AdminAthleteListProps = {
  athletes: Athlete[]
  loading: boolean
}

export const AdminAthleteList: React.FC<AdminAthleteListProps> = ({ athletes, loading }) => {
  return (
    <>
      <Group justify="space-between" style={{ alignItems: 'flex-start' }}>
        <div>
          <Group gap={5} style={{ alignItems: 'center' }}>
            <h2 style={{ marginTop: 0, marginBottom: 0 }}>Athletes</h2>
          </Group>
        </div>
      </Group>

      <Divider my="md"/>

      <LoadingOverlay
        visible={loading} overlayProps={{ radius: 'sm', blur: 2 }}
        loaderProps={{
          children: <Loader text="Loading data..."/>,
        }}
      />

      <AthletesTable athletes={athletes}/>
    </>
  )
}