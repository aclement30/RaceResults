import { AppShell, Group } from '@mantine/core'
import { AdminNavbar } from '../Navbar/Navbar'

export const AdminDashboard = () => {
  return (
    <>
      <AdminNavbar/>

      <AppShell.Main style={{
        backgroundImage: 'url(/header-bg.png)',
        backgroundPosition: 'top 60px right',
        backgroundRepeat: 'no-repeat',
      }}>
        <Group justify="space-between" style={{ alignItems: 'flex-start' }}>
          <div>
            <Group gap={5} style={{ alignItems: 'center' }}>
              <h2 style={{ marginTop: 0, marginBottom: 0 }}>Admin Dashboard</h2>
            </Group>
          </div>
        </Group>

        <p>Welcome to the admin dashboard! Here you can manage your application settings, view analytics, and perform
          administrative tasks.</p>
      </AppShell.Main>
    </>
  )
}