import countriesByAlpha3 from './countries-alpha-3.json'

type CountryInfo = {
  name: string
  'alpha-2': string
  'alpha-3': string
}

// This function takes an alpha-3 country code and returns the corresponding alpha-2 country code
export const getCountryCode = (alpha3Code: string): string | null => {
  return (countriesByAlpha3 as Record<string, CountryInfo>)[alpha3Code]?.['alpha-2'] || null
}