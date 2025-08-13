import { notifications } from '@mantine/notifications'
import { IconX } from '@tabler/icons-react'

export function showErrorMessage({ title, message }: { message: string, title?: string }) {
  notifications.show({
    icon: <IconX/>,
    color: 'red',
    title: title || 'Error',
    message,
    position: 'top-center',
  })
}