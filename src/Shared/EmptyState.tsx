import { Text } from '@mantine/core'
import { IconDatabaseOff } from '@tabler/icons-react'

type EmptyStateProps = {
  icon?: React.ReactNode
  children?: React.ReactNode
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, children }) => {
  return (<div style={{
    flexDirection: 'column',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    margin: '0 auto',
  }}>
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#e9ecef',
      borderRadius: '50%',
      width: 50,
      height: 50,
      color: 'grey',
      marginBottom: '0.5rem',
    }}>
      {icon || (<IconDatabaseOff/>)}
    </div>

    <Text c="dimmed" size="sm">{children || 'No records'}</Text>
  </div>)
}