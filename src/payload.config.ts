import path from 'path'
import { fileURLToPath } from 'url'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { buildConfig } from 'payload'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Categories } from './collections/Categories'
import { Games } from './collections/Games'
import { Posts } from './collections/Posts'
import { Reviews } from './collections/Reviews'
import { Sources } from './collections/Sources'
import { Candidates } from './collections/Candidates'
import { Pages } from './collections/Pages'
import { Messages } from './collections/Messages'
import { migrations } from './migrations'

const dirname = path.dirname(fileURLToPath(import.meta.url))

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
    meta: { titleSuffix: ' · Xboxmania', description: 'Painel do Xboxmania' },
  },
  collections: [Posts, Reviews, Pages, Games, Categories, Media, Candidates, Messages, Sources, Users],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URI },
    // Em desenvolvimento o esquema é sincronizado sozinho. Em produção use migrações (npm run payload migrate).
    push: process.env.NODE_ENV !== 'production',
    prodMigrations: migrations,
  }),
  sharp,
})
