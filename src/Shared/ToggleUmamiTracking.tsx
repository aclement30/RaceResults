import { Button } from '@mantine/core'
import { useState } from 'react'

export const ToggleUmamiTracking = () => {
  const [isTrackingDisabled, setIsTrackingDisabled] = useState(localStorage.getItem('umami.disabled') === '1')

  const toggleTracking = () => {
    if (isTrackingDisabled) {
      localStorage.removeItem('umami.disabled')
      setIsTrackingDisabled(localStorage.getItem('umami.disabled') === '1')
    } else {
      localStorage.setItem('umami.disabled', '1')
      setIsTrackingDisabled(localStorage.getItem('umami.disabled') === '1')
    }
  }

  console.log({ isTrackingDisabled })
  return (
    <div style={{ padding: '2rem' }}>
      <h4 style={{ margin: 0 }}>Umami Tracking</h4>
      <p>{isTrackingDisabled ? 'This device is now excluded from Umami stats' : 'This device is now included in Umami stats'}</p>
      <Button variant="outline" onClick={toggleTracking}>{isTrackingDisabled ? 'Enable' : 'Disable'}</Button>
    </div>
  )
}