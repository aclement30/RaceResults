import { createContext, type ReactNode, useState } from 'react'
import { useDisclosure } from '@mantine/hooks'

export const UIContext = createContext({
  loading: false,
  setLoading: (_: boolean) => {
  },
  isNavbarOpened: false,
  toggleNavbar: () => {
  },
  closeNavbar: () => {
  }
})

export const UIContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [opened, { toggle: toggleNavbar, close: closeNavbar }] = useDisclosure()
  const [loading, setLoading] = useState<boolean>(true)

  const value = { loading, setLoading, isNavbarOpened: opened, toggleNavbar, closeNavbar }

  return (
    <UIContext.Provider value={value}>
      {children}
    </UIContext.Provider>
  )
}