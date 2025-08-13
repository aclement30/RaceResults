import { BrowserRouter, Route, Routes } from 'react-router'
import '@mantine/core/styles.css'
import '@mantine/notifications/styles.css'
import './App.css'
import { createTheme, MantineProvider } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { UIContextProvider } from './UIContext'
import { AppContextProvider } from './AppContext'
import { Public } from './Public/Public'
import { ToggleUmamiTracking } from './Shared/ToggleUmamiTracking'

const theme = createTheme({
  cursorType: 'pointer',
})

function App() {

  return (
    <BrowserRouter>
      <MantineProvider theme={theme}>
        <UIContextProvider>
          <AppContextProvider>
            <Notifications/>

            <Routes>
              <Route path="/toggle-umami" element={<ToggleUmamiTracking/>}/>
              <Route path="*" element={<Public/>}/>
            </Routes>
          </AppContextProvider>
        </UIContextProvider>
      </MantineProvider>
    </BrowserRouter>
  )
}

export default App
