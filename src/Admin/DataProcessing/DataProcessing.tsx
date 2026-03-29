import { AppShell, Divider, Grid, Group } from '@mantine/core'
import { AdminNavbar } from '../Navbar/Navbar'
import { AthletesProcessor } from './Athletes/Athletes'
import { ResultsProcessor } from './Ingestion/Ingestion'

export const AdminDataProcessing = () => {
  return (
    <>
      <AdminNavbar/>

      <AppShell.Main style={{
        backgroundImage: 'url(/header-bg.png)',
        backgroundPosition: 'top 60px right',
        backgroundRepeat: 'no-repeat',
      }}>
        <>
          <Group justify="space-between" style={{ alignItems: 'flex-start' }}>
            <div>
              <Group gap={5} style={{ alignItems: 'center' }}>
                <h2 style={{ marginTop: 0, marginBottom: 0 }}>Data Processing</h2>
              </Group>
            </div>
          </Group>

          <Divider my="md"/>

          <Grid>
            <Grid.Col span={6}>
              <AthletesProcessor/>
            </Grid.Col>
            <Grid.Col span={6}>
              <ResultsProcessor/>
            </Grid.Col>
          </Grid>
        </>
      </AppShell.Main>
    </>
  )
}