import { BrowserRouter, Route, Routes } from 'react-router'
import '@mantine/core/styles.css'
import '@mantine/notifications/styles.css'
import '@mantine/dates/styles.css'
import './App.css'
import { createTheme, MantineProvider } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { ModalsProvider } from '@mantine/modals'
import { UIContextProvider } from './UIContext'
import { AppContextProvider } from './AppContext'
import { Public } from './Public/Public'
import { ToggleUmamiTracking } from './Shared/ToggleUmamiTracking'
// import { Admin } from './Admin/Admin'

const theme = createTheme({
  cursorType: 'pointer',
})

function App() {

  return (
    <BrowserRouter>
      <MantineProvider theme={theme}>
        <ModalsProvider>
          <UIContextProvider>
            <AppContextProvider>
              <Notifications/>

              <Routes>
                <Route path="/toggle-umami" element={<ToggleUmamiTracking/>}/>
                {/*<Route path="/admin/*" element={<Admin/>}/>*/}
                <Route path="*" element={<Public/>}/>
              </Routes>
            </AppContextProvider>
          </UIContextProvider>
        </ModalsProvider>
      </MantineProvider>
    </BrowserRouter>
  )
}

export default App
