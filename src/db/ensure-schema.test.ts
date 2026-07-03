import { createClient } from '@libsql/client'
import { afterEach, describe, expect, it } from 'vitest'

import { ensureSchema } from './ensure-schema'

describe('ensureSchema', () => {
  let client: ReturnType<typeof createClient>

  afterEach(() => {
    client.close()
  })

  it('adiciona coluna observacao em banco legado sem essa coluna', async () => {
    client = createClient({ url: ':memory:' })

    await client.execute(`
      CREATE TABLE caixinhas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        target_amount_cents INTEGER NOT NULL,
        month INTEGER NOT NULL,
        year INTEGER NOT NULL,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
      )
    `)

    const before = await client.execute('PRAGMA table_info(caixinhas)')
    expect(before.rows.some((row) => row.name === 'observacao')).toBe(false)

    await ensureSchema(client)

    const after = await client.execute('PRAGMA table_info(caixinhas)')
    expect(after.rows.some((row) => row.name === 'observacao')).toBe(true)
  })
})
