import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { schemaTypes } from './schemas'
import { projectId, dataset } from './env'
import { media } from 'sanity-plugin-media'
import { structure } from './structure'

export default defineConfig({
  basePath: '/studio',
  projectId,
  dataset,
  plugins: [
    structureTool({
      structure
    }),
    visionTool(),
    media()
  ],
  schema: {
    types: schemaTypes,
  },
})
