import { Anchor, Text } from '@mantine/core'

type SourceProps = {
  sourceUrls?: string[]
}

export const Source: React.FC<SourceProps> = ({ sourceUrls }) => {
  if (!sourceUrls?.length) return null

  return ( <div style={{ maxWidth: '100%' }}>
    <Text c="dimmed" size="sm" style={{ padding: '10px 0 0.25rem' }}>Source:</Text>
    <ul style={{ listStyle: 'none', listStyleType: 'none', margin: 0, paddingLeft: 0, maxWidth: '100%' }}>
      {sourceUrls.sort().map((url) =>
        <li key={url}
            style={{
              marginBottom: '0.5rem',
              maxWidth: '100%',
              overflowWrap: 'break-word'
            }}>
          <Anchor href={url} target="_blank" size="sm" style={{}}>{url}</Anchor>
        </li>
      )}
    </ul>
  </div> )
}