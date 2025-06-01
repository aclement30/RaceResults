import { Anchor, Divider, Text } from '@mantine/core'

export const Credit = () => {
  return <>
    <Divider style={{ marginTop: '0.5rem', marginBottom: '1rem' }}/>

    <Text c="dimmed" size="sm" style={{ paddingLeft: '1rem' }}>
      Created by&nbsp;
      <Anchor href="http://www.alexandreclement.com" target="_blank">
        Alexandre Clement
      </Anchor>
    </Text>
  </>
}