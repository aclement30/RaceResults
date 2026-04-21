import { WebStorageStateStore } from 'oidc-client-ts'

const {
  VITE_ADMIN_AWS_COGNITO_AUTHORITY,
  VITE_ADMIN_AWS_COGNITO_CLIENT_ID,
  VITE_ADMIN_AWS_COGNITO_DOMAIN,
  VITE_API_URL,
} = import.meta.env || {}

export const COGNITO_AUTH_CONFIG = {
  authority: VITE_ADMIN_AWS_COGNITO_AUTHORITY,
  client_id: VITE_ADMIN_AWS_COGNITO_CLIENT_ID,
  redirect_uri: `${window.location.protocol}//${window.location.host}/admin`,
  post_logout_redirect_uri: `${window.location.protocol}//${window.location.host}/admin`,
  response_type: 'code',
  scope: 'openid email',
  userStore: new WebStorageStateStore({ store: window.localStorage }),
  extraQueryParams: {
    prompt: 'select_account',
  },
  onSigninCallback: () => {
    window.history.replaceState({}, document.title, '/admin')
  },
}

export const LOGOUT_URL = `${VITE_ADMIN_AWS_COGNITO_DOMAIN}/logout?client_id=${VITE_ADMIN_AWS_COGNITO_CLIENT_ID}&logout_uri=${encodeURIComponent(COGNITO_AUTH_CONFIG.post_logout_redirect_uri)}`

export const ENV = VITE_API_URL.includes('/api/stage') ? 'stage' : 'production'
