import { createClient as createWebClient } from '@libsql/client/web'
import { drizzle as drizzleWeb } from 'drizzle-orm/libsql/web'

import { ensureSchema } from './ensure-schema.ts'
import * as schema from './schema.ts'

function resolveDatabaseUrl(): string {
  const filePath = process.env.DATABASE_PATH?.trim()
  if (filePath) {
    return filePath.startsWith('file:') ? filePath : `file:${filePath}`
  }
  const tursoUrl = process.env.TURSO_DATABASE_URL
  if (!tursoUrl) {
    throw new Error('Missing DATABASE_PATH or TURSO_DATABASE_URL')
  }
  return tursoUrl
}

const url = resolveDatabaseUrl()
const authToken = process.env.TURSO_AUTH_TOKEN
const isLocal = url.startsWith('file:') || url === ':memory:'
const clientConfig = isLocal
  ? { url }
  : { url, ...(authToken ? { authToken } : {}) }

const isServer = typeof window === 'undefined'
const useNativeClient = isServer && isLocal

async function createDb() {
  if (useNativeClient) {
    const { createClient } = await import('@libsql/client')
    const { drizzle } = await import('drizzle-orm/libsql')
    const client = createClient(clientConfig)
    await ensureSchema(client)
    return drizzle({ client, schema })
  }

  const client = createWebClient(clientConfig)
  await ensureSchema(client)
  return drizzleWeb({ client, schema })
}

export const db = await createDb()
