import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { config } from 'dotenv'

import * as schema from '../src/db/schema.ts'
import { caixinhas, depositos } from '../src/db/schema.ts'

config({ path: ['.env.local', '.env'] })

const client = createClient({
  url: process.env.TURSO_DATABASE_URL ?? 'file:local.db',
  ...(process.env.TURSO_AUTH_TOKEN
    ? { authToken: process.env.TURSO_AUTH_TOKEN }
    : {}),
})

const db = drizzle({ client, schema })

const seedData = [
  {
    name: 'Aluguel',
    targetAmountCents: 185_000,
    month: 6,
    year: 2026,
    sortOrder: 0,
    deposit: { amountCents: 185_000, day: 13, month: 6, year: 2026 },
  },
  {
    name: 'Creche',
    targetAmountCents: 520_000,
    month: 6,
    year: 2026,
    sortOrder: 1,
  },
  {
    name: 'Terapia Ícaro',
    targetAmountCents: 240_000,
    month: 6,
    year: 2026,
    sortOrder: 2,
  },
] as const

async function main() {
  const existing = await db.select().from(caixinhas)

  if (existing.length > 0) {
    console.log(
      `Banco já tem ${existing.length} caixinha(s). Nada foi alterado.`,
    )
    client.close()
    return
  }

  const now = new Date().toISOString()

  for (const item of seedData) {
    const [created] = await db
      .insert(caixinhas)
      .values({
        name: item.name,
        targetAmountCents: item.targetAmountCents,
        month: item.month,
        year: item.year,
        sortOrder: item.sortOrder,
        createdAt: now,
      })
      .returning()

    if ('deposit' in item && item.deposit) {
      await db.insert(depositos).values({
        caixinhaId: created.id,
        amountCents: item.deposit.amountCents,
        day: item.deposit.day,
        month: item.deposit.month,
        year: item.deposit.year,
        createdAt: now,
      })
    }

    console.log(`✓ ${item.name}`)
  }

  console.log('Dados restaurados com sucesso.')
  client.close()
}

main().catch((error) => {
  console.error(error)
  client.close()
  process.exit(1)
})
