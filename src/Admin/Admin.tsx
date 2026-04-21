import { AppShell, LoadingOverlay } from '@mantine/core'
import { ModalsProvider } from '@mantine/modals'
import { useContext, useEffect } from 'react'
import { AuthProvider, useAuth } from 'react-oidc-context'
import { Navigate, Route, Routes } from 'react-router'
import { Loader } from '../Loader/Loader'
import { UIContext } from '../UIContext'
import { AdminAthletes } from './Athletes/Athletes'
import { AdminDashboard } from './Dashboard/Dashboard'
import { AdminDataProcessing } from './DataProcessing/DataProcessing'
import { AdminEvents } from './Events/Events'
import { AdminHeader } from './Header/Header'
import { AdminLogin } from './Login/Login'
import { AdminSerieEdit } from './Series/Edit/Edit'
import {
  SerieEventIndividualStandings as AdminSerieEventIndividualStandings
} from './Series/Edit/EventIndividualStandings/EventIndividualStandings'
import {
  SerieIndividualStandings as AdminSerieIndividualStandings
} from './Series/Edit/IndividualStandings/IndividualStandings'
import { AdminSerieInfoForm } from './Series/Edit/SerieInfoForm/SerieInfoForm'
import { AdminSerieListOutlet } from './Series/List/List'
import { AdminSeries } from './Series/Series'
import { AdminConfigurationFileEditor } from './Settings/AdminConfigurationFileEditor'
import { AdminContext, AdminContextProvider } from './Shared/AdminContext'
import { AdminTeams } from './Teams/Teams'
import { COGNITO_AUTH_CONFIG } from './utils/config'
import { loadAdminStartupData } from './utils/loadAdminStartupData'

export const Admin = () => {
  return (
    <AuthProvider {...COGNITO_AUTH_CONFIG}>
      <AdminContextProvider>
        <ModalsProvider>

          <AdminRouter/>
        </ModalsProvider>
      </AdminContextProvider>
    </AuthProvider>
  )
}

const AdminRouter = () => {
  const { isNavbarOpened } = useContext(UIContext)
  const auth = useAuth()

  const {
    loadingStartupData,
    setLoadingStartupData,
    setOrganizers,
    setYears,
    setAdminUsers,
  } = useContext(AdminContext)

  useEffect(() => {
    if (!auth.isAuthenticated) return

    const fetchData = async () => {
      try {
        setLoadingStartupData(true)

        const { organizers, years, adminUsers } = await loadAdminStartupData()

        setOrganizers(organizers)
        setYears(years)
        setAdminUsers(adminUsers)

        setLoadingStartupData(false)
      } catch (error) {
        console.error(error)
      }
    }

    fetchData()
  }, [auth.isAuthenticated])

  if (!auth.isAuthenticated) {
    return <AdminLogin/>
  }

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 300,
        breakpoint: 'md',
        collapsed: { mobile: !isNavbarOpened, desktop: !isNavbarOpened },
      }}
      padding="md"
    >
      <AdminHeader/>

      <LoadingOverlay
        visible={auth.isLoading || loadingStartupData} overlayProps={{ radius: 'sm', blur: 2 }}
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
          <Route path="/events" element={<AdminEvents/>}/>
          <Route path="/events/:year/:eventHash/edit" element={<AdminEvents/>}/>
          <Route path="/events/:year/:eventHash/edit/:tab" element={<AdminEvents/>}/>
          <Route path="/events/new" element={<AdminEvents/>}/>
          <Route path="/series" element={<AdminSeries/>}>
            <Route index element={<AdminSerieListOutlet/>}/>
            <Route path="/series/new" element={<AdminSerieEdit/>}>
              <Route index element={<AdminSerieInfoForm/>}/>
            </Route>
            <Route path="/series/:year/:serieHash" element={<AdminSerieEdit/>}>
              <Route index element={<AdminSerieInfoForm/>}/>
              <Route path="/series/:year/:serieHash/standings/individual"
                     element={<AdminSerieIndividualStandings/>}/>
              <Route path="/series/:year/:serieHash/standings/individual/:date"
                     element={<AdminSerieEventIndividualStandings/>}/>
              {/*<Route path="/series/:year/:serieHash/standings/team" element={<AdminSerieEdit/>}/>*/}
            </Route>
          </Route>
          <Route path="/data-processing" element={<AdminDataProcessing/>}/>
          <Route path="/settings" element={<Navigate to="/admin/settings/config-files" replace/>}/>
          <Route path="/settings/config-files" element={<AdminConfigurationFileEditor/>}/>
        </Routes>
      )}
    </AppShell>
  )
}