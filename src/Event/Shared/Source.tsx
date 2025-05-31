import { Anchor, Text } from '@mantine/core'

type SourceProps = {
  sourceUrls?: string[]
}

export const Source: React.FC<SourceProps> = ({ sourceUrls }) => {
  if (!sourceUrls?.length) return null

  return ( <>
    <Text c="dimmed" size="sm" style={{ padding: '10px 0 0.25rem' }}>Source:</Text>
    <ul style={{ listStyle: 'none', listStyleType: 'none', margin: 0, paddingLeft: 0 }}>
      {sourceUrls.sort().map((url) =>
        <li key={url} style={{ marginBottom: '0.5rem' }}>
          <Anchor href={url} target="_blank" size="sm">{url}</Anchor>
        </li>
      )}
    </ul>
  </> )
}