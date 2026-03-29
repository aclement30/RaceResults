import { build } from 'esbuild'
import { resolve } from 'path'
import { writeFile } from 'fs/promises'

const result = await build({
  entryPoints: ['index.ts'],
  bundle: true,
  external: ['@aws-sdk'],
  sourcemap: true,
  platform: 'node',
  target: 'es2020',
  metafile: true,
  outfile: 'dist/index.js',
  alias: {
    'shared': resolve(import.meta.dirname, '../shared'),
  },
})

await writeFile('dist/metadata.json', JSON.stringify(result.metafile))
