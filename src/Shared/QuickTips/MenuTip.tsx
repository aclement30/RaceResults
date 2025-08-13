import { Burger, Button, type CSSProperties, Text, useMatches } from '@mantine/core'
import { IconArrowRight } from '@tabler/icons-react'
import type { TipProps } from './QuickTips'

export const MenuTip: React.FC<TipProps> = ({ onNext }) => {
  const nextBtnStyles = useMatches({
    base: {
      display: 'flex',
      justifyContent: 'center',
      margin: '2rem auto',
      width: '100%',
    },
    xs: {
      position: 'absolute',
      bottom: '1rem',
      right: '1rem',
      display: 'flex',
      justifyContent: 'center',
      margin: '1rem'
    }
  })

  return (
    <>
      <div style={{
        position: 'absolute',
        top: 5,
        left: 5,
        backgroundColor: '#e9ecef',
        borderRadius: '50%',
        width: 50,
        height: 50,
        color: 'grey',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Burger
          size="sm"
        />
      </div>

      <div style={{ position: 'absolute', top: 15, left: 70, color: 'white', width: '300px' }}>
        <h2 style={{ margin: 0, lineHeight: '1.2em', fontWeight: 600 }}>Open the side menu<br/><span
          style={{ fontSize: 'smaller' }}>for more...</span>
        </h2>

        <Text c="white" size="md"
              style={{ display: 'inline-block', marginTop: '1rem', paddingRight: '1rem', fontWeight: 500 }}>
          The side menu contains filters, race categories and your favourites teams & athletes.</Text>
      </div>

      <div style={{ marginTop: 180 }}>
        <div style={{ margin: '1rem auto 0', maxWidth: 400, maxHeight: '50vh', overflowY: 'hidden' }}>
          <img src="/menu-tip-screenshot.png" style={{ width: '100%', objectFit: 'contain' }}/>
        </div>
      </div>

      <div style={nextBtnStyles as CSSProperties}>
        <Button size="xs" rightSection={<IconArrowRight size={14}/>} onClick={onNext}>Next (1/2)</Button>
      </div>
    </>
  )
}
