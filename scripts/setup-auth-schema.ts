import { createClient } from '@libsql/client'
import { config } from 'dotenv'

import { ensureSchema } from '../src/db/ensure-schema.ts'

config({ path: ['.env.local', '.env'] })

const client = createClient({
  url: process.env.TURSO_DATABASE_URL ?? 'file:local.db',
  ...(process.env.TURSO_AUTH_TOKEN
    ? { authToken: process.env.TURSO_AUTH_TOKEN }
    : {}),
})

async function main() {
  await ensureSchema(client)
  console.log('✓ Schema verificado')
  client.close()
}

main().catch((error) => {
  console.error(error)
  client.close()
  process.exit(1)
})
