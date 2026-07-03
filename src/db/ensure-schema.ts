import type { Client } from '@libsql/client'

async function columnExists(client: Client, table: string, column: string) {
  const result = await client.execute(`PRAGMA table_info(${table})`)
  return result.rows.some((row) => row.name === column)
}

async function tableExists(client: Client, table: string) {
  const result = await client.execute(
    `SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?`,
    [table],
  )
  return result.rows.length > 0
}

export async function ensureSchema(client: Client) {
  if (!(await tableExists(client, 'users'))) {
    await client.execute(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        created_at TEXT NOT NULL
      )
    `)
  }

  if (!(await tableExists(client, 'sessions'))) {
    await client.execute(`
      CREATE TABLE sessions (
        id TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        expires_at TEXT NOT NULL,
        created_at TEXT NOT NULL
      )
    `)
  }

  if (!(await columnExists(client, 'caixinhas', 'user_id'))) {
    await client.execute(`ALTER TABLE caixinhas ADD COLUMN user_id INTEGER`)
  }

  if (!(await columnExists(client, 'caixinhas', 'observacao'))) {
    await client.execute(`ALTER TABLE caixinhas ADD COLUMN observacao TEXT`)
  }
}
