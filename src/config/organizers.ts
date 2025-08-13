export const ORGANIZERS: Record<string, {
  label: string,
  labelShort?: string,
  color: string,
  textColor?: 'black' | 'white'
}> = {
  'Concord': {
    label: 'Concord',
    color: '#005daa',
  },
  'CRC': {
    label: 'Coastal Race Club',
    labelShort: 'CRC',
    color: '#df2334',
  },
  'EscapeVelocity': {
    label: 'Escape Velocity',
    color: '#ec4464'
  },
  'GastownGP': {
    label: 'Gastown Grand Prix',
    labelShort: 'Gastown GP',
    color: '#ee3124',
  },
  'GoodRideGravel': {
    label: 'GoodRide Gravel',
    color: '#e89d87',
  },
  'LocalRide': {
    label: 'Local Ride',
    color: '#3886c7'
  },
  'PanacheCyclingSports': {
    label: 'Panache Cycling Sports',
    labelShort: 'Panache Cycling',
    color: '#e12929',
  },
  'RevoRacing': {
    label: 'Revo Racing',
    color: '#52b0af',
  },
  'RideForWater': {
    label: 'Ride For Water',
    color: '#02b9d0',
  },
  'ShimsRide': {
    label: 'Shim\'s Ride',
    color: '#de0112',
  },
  'Thrashers': {
    label: 'Thrashers',
    color: '#ffed29',
    textColor: 'black',
  },
  'TourDeBloom': {
    label: 'Tour de Bloom',
    labelShort: 'TdB',
    color: '#68bb45',
  },
  'UnitedVelo': {
    label: 'United Velo',
    color: '#3aae49',
  },
  'VictoriaCycling': {
    label: 'Victoria Cycling League',
    labelShort: 'VCL',
    color: 'black',
  },
  'WestCoastCycling': {
    label: 'West Coast Cycling',
    color: '#2cace3',
  },
}