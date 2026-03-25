import { notifications } from '@mantine/notifications'
import { IconCheck } from '@tabler/icons-react'

export function showSuccessMessage({ title, message }: { message: string, title?: string }) {
  notifications.show({
    icon: <IconCheck/>,
    color: 'green',
    title: title || 'Success',
    message,
    position: 'top-center',
  })
}

export const showMessage = ({ title, message, icon, color }: {
  message: string,
  title: string,
  icon: React.ReactNode,
  color: string
}) => {
  notifications.show({
    icon,
    color,
    title,
    message,
    position: 'top-center',
  })
}