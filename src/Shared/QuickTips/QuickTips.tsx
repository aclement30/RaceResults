import { useEffect, useState } from 'react'
import { em, Overlay } from '@mantine/core'
import { useDisclosure, useMediaQuery } from '@mantine/hooks'
import { MenuTip } from './MenuTip'
import { RotatePhoneTip } from './RotatePhoneTip'

export type TipProps = {
  onNext: () => void
}

const ALL_UI_TIPS: Record<string, React.FC<TipProps>> = {
  'SIDEBAR-MENU': MenuTip,
  'ROTATE-PHONE': RotatePhoneTip,
}

const getViewedTips = () => {
  const viewedTips = localStorage.getItem('viewed-ui-tips')
  if (viewedTips) {
    return JSON.parse(viewedTips)
  }
  return []
}

const setViewedTips = (tips: string[]) => {
  localStorage.setItem('viewed-ui-tips', JSON.stringify(tips))
}

export const QuickTips: React.FC = () => {
  const [opened, { toggle }] = useDisclosure(false)
  const [tips, setTips] = useState<string[]>([])
  const [visibleTipIdx, setVisibleTip] = useState(0)

  const isMobile = useMediaQuery(`(max-width: ${em(750)})`)

  useEffect(() => {
    const viewedTips = getViewedTips()
    if (viewedTips.length < Object.keys(ALL_UI_TIPS).length) {
      const remainingTips = Object.keys(ALL_UI_TIPS).filter(tip => !viewedTips.includes(tip))
      setTips(remainingTips)

      toggle()
    }
  }, [])

  const showNextTip = () => {
    const viewedTips = getViewedTips()
    if (!viewedTips.includes(tips[visibleTipIdx])) {
      setViewedTips([...viewedTips, tips[visibleTipIdx]])
    }

    if (visibleTipIdx === tips.length - 1) {
      toggle()
    } else {
      setVisibleTip(visibleTipIdx + 1)
    }
  }

  if (!opened || !isMobile) return null

  const TipComponent = ALL_UI_TIPS[tips[visibleTipIdx]]

  return (
    <div style={{ position: 'fixed', width: '100%', height: '100%', zIndex: 1000, overflow: 'hidden' }}>
      <Overlay color="#000" backgroundOpacity={0.6} blur={2}/>

      <div style={{
        position: 'fixed',
        zIndex: 1000,
        width: '100%',
        height: '100%',
      }}>
        <TipComponent onNext={showNextTip}/>
      </div>
    </div>
  )
}