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