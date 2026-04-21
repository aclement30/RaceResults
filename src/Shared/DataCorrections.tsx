import { Blockquote, Group, Text } from '@mantine/core'
import { IconHelp } from '@tabler/icons-react'
import React from 'react'

type DataCorrectionsProps = {
  corrections: string | null
}

export const DataCorrections: React.FC<DataCorrectionsProps> = ({ corrections }) => {
  if (!corrections) return null

  return (
    <Blockquote color="yellow" mt="lg" p="md">
      <Group justify="space-between" style={{ marginBottom: '0.5rem' }}>
        <h5 style={{ margin: 0 }}>Data Corrections</h5>
        <Text
          size="xs"
          c="dimmed"
        >
          <IconHelp size="14" style={{ verticalAlign: 'text-bottom' }}/>
          Changes from the original source
        </Text>
      </Group>
      
      <div
        dangerouslySetInnerHTML={{ __html: corrections.replace(/\n/g, '<br />') }}
        style={{ fontSize: 'smaller' }}/>
    </Blockquote>
  )
}