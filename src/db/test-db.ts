import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'

import * as schema from './schema.ts'

export type TestDatabase = ReturnType<typeof drizzle<typeof schema>> & {
  close: () => Promise<void>
}

export async function createTestDb(): Promise<TestDatabase> {
  const client = createClient({ url: ':memory:' })
  const db = drizzle({ client, schema }) as TestDatabase

  await client.execute(`
    CREATE TABLE caixinhas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      target_amount_cents INTEGER NOT NULL,
      month INTEGER NOT NULL,
      year INTEGER NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    )
  `)

  await client.execute(`
    CREATE TABLE depositos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      caixinha_id INTEGER NOT NULL REFERENCES caixinhas(id) ON DELETE CASCADE,
      amount_cents INTEGER NOT NULL,
      day INTEGER NOT NULL,
      month INTEGER NOT NULL,
      year INTEGER NOT NULL,
      created_at TEXT NOT NULL
    )
  `)

  db.close = async () => {
    client.close()
  }

  return db
}
