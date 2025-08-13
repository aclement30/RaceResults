import { ORGANIZERS } from '../config/organizers'
import { Badge } from '@mantine/core'

function getOrganizerLabel(organizer: string): { long: string, short: string } {
  return {
    long: ORGANIZERS[organizer]?.label || organizer,
    short: ORGANIZERS[organizer]?.labelShort || ORGANIZERS[organizer]?.label || organizer,
  }
}

function getOrganizerColor(organizer: string): string {
  return ORGANIZERS[organizer]?.color || 'black'
}

function getOrganizerTextColor(organizer: string): string {
  return ORGANIZERS[organizer]?.textColor || 'white'
}

export const OrganizerBadge = ({ organizerAlias }: { organizerAlias: string }) => {
  const organizerLabel = getOrganizerLabel(organizerAlias)
  return (
    <>
      <Badge
        color={getOrganizerColor(organizerAlias)}
        size="lg"
        style={{ color: getOrganizerTextColor(organizerAlias) }}
        styles={{ label: { overflow: 'visible' } }}
        hiddenFrom="sm"
      >
        {organizerLabel.short}
      </Badge>
      <Badge
        color={getOrganizerColor(organizerAlias)}
        size="lg"
        style={{ color: getOrganizerTextColor(organizerAlias) }}
        visibleFrom="sm"
      >
        {organizerLabel.long}
      </Badge>
    </>
  )
}