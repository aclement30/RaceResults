import { config as dotEnvConfig } from 'dotenv'

dotEnvConfig({ path: '.env.local' })

export const FEEDBACK_TABLE = 'race-results-feedback'
export const AWS_COGNITO_USER_POOL_ID = process.env.AWS_COGNITO_USER_POOL_ID