import { useAuth } from 'react-oidc-context'
import { IconLogin2 } from '@tabler/icons-react'
import './Login.css'
import { Loader } from '../../Loader/Loader'

export const AdminLogin: React.FC = () => {
  const auth = useAuth()

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1 className="login-title">BC Race Results <span style={{ fontStyle: 'normal', fontWeight: 'lighter' }}> | Admin</span>
          </h1>
        </div>

        {auth.isLoading ? (
          <Loader text="Loading..."/>
        ) : (
          <div className="login-content">
            <p className="login-description">
              Sign in to access the administration dashboard
            </p>

            <button
              className="login-button"
              onClick={() => auth.signinRedirect()}
            >
              <IconLogin2/>
              Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  )
}