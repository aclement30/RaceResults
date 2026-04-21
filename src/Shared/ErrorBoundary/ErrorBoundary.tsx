import { Button, Stack, Text } from '@mantine/core'
import { IconAlertCircle } from '@tabler/icons-react'
import React from 'react'

type Props = {
  children: React.ReactNode
  fallback?: React.ReactNode
}

type State = {
  error: Error | null
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  reset = () => this.setState({ error: null })

  render() {
    const { error } = this.state

    if (error) {
      if (this.props.fallback) return this.props.fallback

      return (
        <Stack align="center" gap="sm" p="xl">
          <IconAlertCircle size={48} color="var(--mantine-color-red-6)"/>
          <Text fw={600}>Something went wrong</Text>
          <Text size="sm" c="dimmed">Error: {error.message}</Text>
          <Button size="xs" variant="light" onClick={this.reset}>Try again</Button>
        </Stack>
      )
    }

    return this.props.children
  }
}
