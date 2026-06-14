import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { config } from 'dotenv'

import * as schema from '../src/db/schema.ts'
import { caixinhas, depositos } from '../src/db/schema.ts'

config({ path: ['.env.local', '.env'] })

const remoteUrl = process.env.TURSO_REMOTE_URL
const remoteToken = process.env.TURSO_REMOTE_AUTH_TOKEN

if (!remoteUrl || !remoteToken) {
  console.error(
    'Defina TURSO_REMOTE_URL e TURSO_REMOTE_AUTH_TOKEN (banco Turso de produção).',
  )
  process.exit(1)
}

const localClient = createClient({ url: 'file:local.db' })
const remoteClient = createClient({
  url: remoteUrl,
  authToken: remoteToken,
})

const localDb = drizzle({ client: localClient, schema })
const remoteDb = drizzle({ client: remoteClient, schema })

async function main() {
  const localCaixinhas = await localDb.select().from(caixinhas)
  const localDepositos = await localDb.select().from(depositos)

  if (localCaixinhas.length === 0) {
    console.log('Nenhum dado em local.db.')
    localClient.close()
    remoteClient.close()
    return
  }

  const remoteCaixinhas = await remoteDb.select().from(caixinhas)

  if (remoteCaixinhas.length > 0) {
    console.log(
      `Turso já tem ${remoteCaixinhas.length} caixinha(s). Use --force para sobrescrever.`,
    )
    if (!process.argv.includes('--force')) {
      localClient.close()
      remoteClient.close()
      return
    }

    await remoteDb.delete(depositos)
    await remoteDb.delete(caixinhas)
    console.log('Dados remotos limpos.')
  }

  for (const row of localCaixinhas) {
    await remoteDb.insert(caixinhas).values({
      id: row.id,
      name: row.name,
      targetAmountCents: row.targetAmountCents,
      month: row.month,
      year: row.year,
      sortOrder: row.sortOrder,
      createdAt: row.createdAt,
    })
    console.log(`✓ caixinha: ${row.name}`)
  }

  for (const row of localDepositos) {
    await remoteDb.insert(depositos).values({
      id: row.id,
      caixinhaId: row.caixinhaId,
      amountCents: row.amountCents,
      day: row.day,
      month: row.month,
      year: row.year,
      createdAt: row.createdAt,
    })
    console.log(`✓ depósito: caixinha ${row.caixinhaId} · R$ ${row.amountCents / 100}`)
  }

  console.log(
    `Migrados ${localCaixinhas.length} caixinha(s) e ${localDepositos.length} depósito(s).`,
  )

  localClient.close()
  remoteClient.close()
}

main().catch((error) => {
  console.error(error)
  localClient.close()
  remoteClient.close()
  process.exit(1)
})
