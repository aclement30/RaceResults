import './Login.css'
import { Button, Code } from '@mantine/core'
import React from 'react'
import { useAuth } from 'react-oidc-context'
import { LOGOUT_URL } from '../utils/config'

export const AdminAuthError: React.FC = () => {
  const auth = useAuth()

  const logoutUser = () => {
    auth.removeUser()
    window.location.href = LOGOUT_URL
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-content">
          <h3 style={{ margin: 0 }}>Authentication Error</h3>

          <p className="login-description">
            An error occurred during authentication.<br/>Please try logging in again. If the problem persists, contact
            the page administrator.
          </p>

          {!!auth.error?.message && (
            <Code pt="md" pb="md" style={{ textAlign: 'left' }}>Error: {auth.error?.message}</Code>
          )}

          <Button variant="outline" size="xs" onClick={logoutUser}>Logout</Button>
        </div>
      </div>
    </div>
  )
}