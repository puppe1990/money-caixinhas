import { eq } from 'drizzle-orm'
import type { LibSQLDatabase } from 'drizzle-orm/libsql'

import { caixinhas } from '#/db/schema'
import type * as schema from '#/db/schema'

import { ensureSeedUser } from './repository'

type Database = LibSQLDatabase<typeof schema>

export async function assignAllCaixinhasToUser(db: Database, userId: number) {
  const rows = await db.select({ id: caixinhas.id }).from(caixinhas)

  await Promise.all(
    rows.map((row) =>
      db.update(caixinhas).set({ userId }).where(eq(caixinhas.id, row.id)),
    ),
  )

  return rows.length
}

export async function migrateDataToUser(
  db: Database,
  input: { email: string; password: string },
) {
  const user = await ensureSeedUser(db, input)
  const migratedCount = await assignAllCaixinhasToUser(db, user.id)

  return {
    userId: user.id,
    email: user.email,
    migratedCount,
  }
}
