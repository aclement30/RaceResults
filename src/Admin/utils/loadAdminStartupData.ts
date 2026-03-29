import { fetchEventYears } from '../../utils/aws-s3'
import { adminApi } from './api'

export async function loadAdminStartupData() {
  const [organizers, years, adminUsers] = await Promise.all([
    adminApi.get.organizers(),
    fetchEventYears(),
    adminApi.get.adminUsers()
  ])

  return {
    organizers,
    years,
    adminUsers,
  }
}