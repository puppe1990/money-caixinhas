import { createClient as createWebClient } from '@libsql/client/web'
import { drizzle as drizzleWeb } from 'drizzle-orm/libsql/web'

import * as schema from './schema.ts'

const url = process.env.TURSO_DATABASE_URL!
const authToken = process.env.TURSO_AUTH_TOKEN
const clientConfig = {
  url,
  ...(authToken ? { authToken } : {}),
}

async function createDb() {
  if (import.meta.env.DEV && url.startsWith('file:')) {
    const { createClient } = await import('@libsql/client')
    const { drizzle } = await import('drizzle-orm/libsql')
    return drizzle({ client: createClient(clientConfig), schema })
  }

  return drizzleWeb({
    client: createWebClient(clientConfig),
    schema,
  })
}

export const db = await createDb()
