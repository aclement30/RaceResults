import { Button, Text } from '@mantine/core'
import { useNavigate } from 'react-router'
import { IconArrowLeft } from '@tabler/icons-react'

type ResourceNotFoundProps = {
  image?: React.ReactNode
  title?: React.ReactNode
  text?: React.ReactNode
}

export const ResourceNotFound: React.FC<ResourceNotFoundProps> = ({ image, title, text }) => {
  const navigate = useNavigate()

  return (<div style={{
    flexDirection: 'column',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1.5rem',
    margin: '0 auto',
  }}>
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#e9ecef',
      borderRadius: '50%',
      color: 'grey',
      marginBottom: '0.5rem',
    }}>
      {image || (<img src="/no-cycling.png" style={{ width: 150 }}/>)}
    </div>

    <h2>{title || 'Page Not Found'}</h2>
    <Text c="dimmed" size="sm" style={{ textAlign: 'center' }}>{text || 'Sorry, we couldn\'t find the page'}</Text>

    <Button onClick={() => navigate('/events')} style={{ marginTop: '2rem' }} leftSection={<IconArrowLeft size={14}/>}>
      Return to Homepage
    </Button>
  </div>)
}