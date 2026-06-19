import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { config } from 'dotenv'

import * as schema from '../src/db/schema.ts'
import { migrateDataToUser } from '../src/lib/auth/migrate-data.ts'

config({ path: ['.env.local', '.env'] })

const email = 'matheus.puppe@gmail.com'
const password = process.env.SEED_USER_PASSWORD ?? 'Caixinhas2026!'

const client = createClient({
  url: process.env.TURSO_DATABASE_URL ?? 'file:local.db',
  ...(process.env.TURSO_AUTH_TOKEN
    ? { authToken: process.env.TURSO_AUTH_TOKEN }
    : {}),
})

const db = drizzle({ client, schema })

async function main() {
  const result = await migrateDataToUser(db, { email, password })

  console.log(`✓ Usuário: ${result.email}`)
  console.log(`✓ Caixinhas migradas: ${result.migratedCount}`)
  console.log(`✓ Senha inicial: ${password}`)
  client.close()
}

main().catch((error) => {
  console.error(error)
  client.close()
  process.exit(1)
})
