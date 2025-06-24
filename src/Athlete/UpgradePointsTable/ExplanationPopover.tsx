import { useDisclosure } from '@mantine/hooks'
import { ActionIcon, Popover, Text } from '@mantine/core'
import { IconHelp } from '@tabler/icons-react'
import { UpgradePointExplanation, type UpgradePointExplanationProps } from '../../Event/Shared/UpgradePointExplanation'

export const ExplanationPopover: React.FC<UpgradePointExplanationProps & { pointType: 'UPGRADE' | 'SUBJECTIVE' }> = ({
  fieldSize,
  eventTypeLabel,
  combinedCategories,
  isDoubleUpgradePoints,
  pointType
}) => {
  const [opened, { close, open }] = useDisclosure(false)

  return (
    <Popover width={400} position="left-start" withArrow shadow="md" opened={opened}>
      <Popover.Target>
        <ActionIcon variant="subtle" aria-label="Points Explanation" onMouseEnter={open} onMouseLeave={close}
                    visibleFrom="sm">
          <IconHelp style={{ width: '70%', height: '70%' }} stroke={1.5}/>
        </ActionIcon>
      </Popover.Target>
      <Popover.Dropdown style={{ pointerEvents: 'none' }}>
        <UpgradePointExplanation
          fieldSize={fieldSize} eventTypeLabel={eventTypeLabel}
          combinedCategories={combinedCategories}
          isDoubleUpgradePoints={isDoubleUpgradePoints}
        >
          <Text size="sm" fw={500}
                mb="xs">{pointType === 'UPGRADE' ? ' Upgrade Points' : 'Subjective Points'}</Text>
        </UpgradePointExplanation>
      </Popover.Dropdown>
    </Popover>
  )
}