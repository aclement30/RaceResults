import { useContext } from 'react'
import { Route, Routes, Navigate } from 'react-router'
import { AppShell, LoadingOverlay } from '@mantine/core'
import { AdminHeader } from './Header/Header'
import { Loader } from '../Loader/Loader'
import { UIContext } from '../UIContext'
import { AdminDashboard } from './Dashboard/Dashboard'
import { AdminAthletes } from './Athletes/Athletes'
import { AuthProvider, useAuth } from 'react-oidc-context'
import { COGNITO_AUTH_CONFIG } from './utils/config'
import { AdminLogin } from './Login/Login'
import { AdminTeams } from './Teams/Teams'
import { AdminDataProcessing } from './DataProcessing/DataProcessing'
import { AdminConfigurationFileEditor } from './Settings/AdminConfigurationFileEditor'

export const Admin = () => {
  return (
    <AuthProvider {...COGNITO_AUTH_CONFIG}>
      <AdminRouter/>
    </AuthProvider>
  )
}

const AdminRouter = () => {
  const { isNavbarOpened } = useContext(UIContext)
  const auth = useAuth()

  if (!auth.isAuthenticated) {
    return <AdminLogin/>
  }

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 300,
        breakpoint: 'md',
        collapsed: { mobile: !isNavbarOpened },
      }}
      padding="md"
    >
      <AdminHeader/>

      <LoadingOverlay
        visible={auth.isLoading} overlayProps={{ radius: 'sm', blur: 2 }}
        loaderProps={{
          children: <Loader text="Loading..."/>,
        }}
      />

      {auth.error && (
        <div style={{ color: 'red' }}>
          Authentication error: {auth.error.message}
        </div>
      )}

      {!auth.isLoading && auth.isAuthenticated && (
        <Routes>
          <Route path="/" element={<AdminDashboard/>}/>
          <Route path="/athletes" element={<AdminAthletes/>}/>
          <Route path="/athletes/:athleteUciId/edit" element={<AdminAthletes/>}/>
          <Route path="/teams" element={<AdminTeams/>}/>
          <Route path="/teams/new" element={<AdminTeams/>}/>
          <Route path="/teams/:teamId/edit" element={<AdminTeams/>}/>
          <Route path="/data-processing" element={<AdminDataProcessing/>}/>
          <Route path="/settings" element={<Navigate to="/admin/settings/config-files" replace/>}/>
          <Route path="/settings/config-files" element={<AdminConfigurationFileEditor/>}/>
        </Routes>
      )}
    </AppShell>
  )
}