import { IconRotateClockwise2, IconX } from '@tabler/icons-react'
import { Button, type CSSProperties, Group, Text, useMatches } from '@mantine/core'
import type { TipProps } from './QuickTips'

export const RotatePhoneTip: React.FC<TipProps> = ({ onNext }) => {
  const groupStyles = useMatches({
    base: {
      display: 'flex',
      flexDirection: 'column',
      padding: '2rem 0 0',
      textAlign: 'center'
    },
    xs: {
      display: 'flex',
      padding: '2rem 6rem 0',
      textAlign: 'left'
    }
  })

  return (
    <div style={{ position: 'absolute', marginTop: '3rem' }}>
      <div style={groupStyles as CSSProperties}>
        <div style={{
          backgroundColor: '#e9ecef',
          borderRadius: '50%',
          width: 120,
          height: 120,
          margin: '0 auto',
          color: 'grey',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flex: '0 0 auto',
        }}>
          <IconRotateClockwise2 size={60}/>
        </div>

        <div style={{ color: 'white', margin: '2rem' }}>
          <h2 style={{ margin: 0, lineHeight: '1.2em', fontWeight: 600 }}>Rotate your phone<br/><span
            style={{ fontSize: 'smaller' }}>for more...</span>
          </h2>

          <Text c="white" size="md"
                style={{ display: 'inline-block', marginTop: '1rem', paddingRight: '1rem', fontWeight: 500 }}>
            The landscape view displays more data columns and information about races results.</Text>
        </div>
      </div>

      <Group style={{ display: 'flex', justifyContent: 'center' }}>
        <Button size="xs" leftSection={<IconX size={14}/>} onClick={onNext}>Close</Button>
      </Group>
    </div>
  )
}