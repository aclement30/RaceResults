import type { SerieSummary } from '../../types/results'
import { useNavigate } from 'react-router'
import { Button, Card, Group } from '@mantine/core'
import { OrganizerBadge } from '../../Event/Shared/OrganizerBadge'
import { IconUsersGroup, IconUserStar } from '@tabler/icons-react'

type SerieCardProps = {
  serie: SerieSummary
}

export const SerieCard: React.FC<SerieCardProps> = ({ serie }) => {
  let navigate = useNavigate()

  return (
    <Card
      shadow="sm"
      padding="lg"
      radius="md"
      withBorder
      style={{ marginBottom: '1rem' }}
    >
      {/*<div style={{*/}
      {/*  backgroundColor: '#dee2e6',*/}
      {/*  padding: '2px 6px',*/}
      {/*  display: 'inline-block',*/}
      {/*  alignSelf: 'flex-start',*/}
      {/*  fontWeight: 700,*/}
      {/*}}>*/}
      {/*  {serie.year}*/}
      {/*</div>*/}

      <Card.Section withBorder inheritPadding py="md">
        <Group justify="space-between" style={{ alignItems: 'center', flexWrap: 'nowrap' }}>
          <h3 style={{
            marginTop: 0,
            marginBottom: 0
          }}>{serie.name.includes(serie.year.toString()) ? '' : serie.year} {serie.name}</h3>
          <OrganizerBadge organizerAlias={serie.organizerAlias}/>
        </Group>
      </Card.Section>

      {serie.categories.team && (
        <Card.Section withBorder inheritPadding style={{ paddingTop: 5, paddingBottom: 5 }}>
          <Button variant="transparent" leftSection={<IconUsersGroup/>}
                  fullWidth justify="left"
                  style={{ paddingLeft: 0 }}
                  onClick={() => navigate(`/series/${serie.year}/${serie.hash}/team`)}>{serie.year} Series Team
            Results</Button>
        </Card.Section>
      )}

      {serie.categories.individual && (
        <Card.Section withBorder inheritPadding style={{ paddingTop: 5, paddingBottom: 5 }}>
          <Button variant="transparent" leftSection={<IconUserStar/>}
                  fullWidth justify="left"
                  style={{ paddingLeft: 0 }}
                  onClick={() => navigate(`/series/${serie.year}/${serie.hash}/individual`)}>Individual Series
            Results</Button>
        </Card.Section>
      )}
    </Card>
  )
}