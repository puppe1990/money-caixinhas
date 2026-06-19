import { createClient } from '@libsql/client'
import { config } from 'dotenv'

config({ path: ['.env.local', '.env'] })

const client = createClient({
  url: process.env.TURSO_DATABASE_URL ?? 'file:local.db',
  ...(process.env.TURSO_AUTH_TOKEN
    ? { authToken: process.env.TURSO_AUTH_TOKEN }
    : {}),
})

async function columnExists(table: string, column: string) {
  const result = await client.execute(`PRAGMA table_info(${table})`)
  return result.rows.some((row) => row.name === column)
}

async function tableExists(table: string) {
  const result = await client.execute(
    `SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?`,
    [table],
  )
  return result.rows.length > 0
}

async function main() {
  if (!(await tableExists('users'))) {
    await client.execute(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        created_at TEXT NOT NULL
      )
    `)
    console.log('✓ Tabela users criada')
  }

  if (!(await tableExists('sessions'))) {
    await client.execute(`
      CREATE TABLE sessions (
        id TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        expires_at TEXT NOT NULL,
        created_at TEXT NOT NULL
      )
    `)
    console.log('✓ Tabela sessions criada')
  }

  if (!(await columnExists('caixinhas', 'user_id'))) {
    await client.execute(`ALTER TABLE caixinhas ADD COLUMN user_id INTEGER`)
    console.log('✓ Coluna caixinhas.user_id adicionada')
  }

  client.close()
}

main().catch((error) => {
  console.error(error)
  client.close()
  process.exit(1)
})
