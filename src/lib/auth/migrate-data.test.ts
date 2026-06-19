import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import type { TestDatabase } from '#/db/test-db'
import { caixinhas } from '#/db/schema'
import { createCaixinha } from '#/lib/caixinhas/repository'
import { createUser } from '#/lib/auth/repository'

import { migrateDataToUser } from './migrate-data'

describe('migrate data to user', () => {
  let db: TestDatabase

  beforeEach(async () => {
    const { createTestDb } = await import('#/db/test-db')
    db = await createTestDb()
  })

  afterEach(async () => {
    await db.close()
  })

  it('cria usuário e associa todas as caixinhas existentes', async () => {
    const previousOwnerId = await createUser(db, {
      email: 'antigo@gmail.com',
      password: 'senha-antiga',
    }).then((user) => user.id)

    await createCaixinha(db, previousOwnerId, {
      name: 'Aluguel',
      targetAmountCents: 185_000,
      month: 6,
      year: 2026,
    })
    await createCaixinha(db, previousOwnerId, {
      name: 'Creche',
      targetAmountCents: 520_000,
      month: 6,
      year: 2026,
    })

    const result = await migrateDataToUser(db, {
      email: 'matheus.puppe@gmail.com',
      password: 'senha-segura',
    })

    const rows = await db.select().from(caixinhas)

    expect(result).toMatchObject({
      email: 'matheus.puppe@gmail.com',
      migratedCount: 2,
    })
    expect(rows.every((row) => row.userId === result.userId)).toBe(true)
  })
})
