import { fetchEventYears } from './aws-s3'

export async function loadStartupData() {
  const years = await fetchEventYears()

  return {
    years,
  }
}