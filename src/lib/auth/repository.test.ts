import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { eq } from 'drizzle-orm'

import type { TestDatabase } from '#/db/test-db'
import { sessions, users } from '#/db/schema'

import {
  createSession,
  createUser,
  ensureSeedUser,
  findUserByEmail,
  findValidSession,
  revokeSession,
  verifyUserCredentials,
} from './repository'

describe('auth repository', () => {
  let db: TestDatabase

  beforeEach(async () => {
    const { createTestDb } = await import('#/db/test-db')
    db = await createTestDb()
  })

  afterEach(async () => {
    await db.close()
  })

  it('cria usuário com e-mail normalizado', async () => {
    const user = await createUser(db, {
      email: ' Matheus.Puppe@Gmail.com ',
      password: 'senha-segura',
    })

    expect(user.email).toBe('matheus.puppe@gmail.com')

    const rows = await db.select().from(users)
    expect(rows).toHaveLength(1)
  })

  it('encontra usuário por e-mail ignorando maiúsculas', async () => {
    await createUser(db, {
      email: 'matheus.puppe@gmail.com',
      password: 'senha-segura',
    })

    const found = await findUserByEmail(db, 'MATHEUS.PUPPE@GMAIL.COM')

    expect(found?.email).toBe('matheus.puppe@gmail.com')
  })

  it('valida credenciais corretas', async () => {
    await createUser(db, {
      email: 'matheus.puppe@gmail.com',
      password: 'senha-segura',
    })

    const user = await verifyUserCredentials(db, {
      email: 'matheus.puppe@gmail.com',
      password: 'senha-segura',
    })

    expect(user?.email).toBe('matheus.puppe@gmail.com')
  })

  it('rejeita credenciais inválidas', async () => {
    await createUser(db, {
      email: 'matheus.puppe@gmail.com',
      password: 'senha-segura',
    })

    const wrongPassword = await verifyUserCredentials(db, {
      email: 'matheus.puppe@gmail.com',
      password: 'senha-errada',
    })
    const unknownEmail = await verifyUserCredentials(db, {
      email: 'outro@gmail.com',
      password: 'senha-segura',
    })

    expect(wrongPassword).toBeNull()
    expect(unknownEmail).toBeNull()
  })

  it('cria e valida sessão ativa', async () => {
    const user = await createUser(db, {
      email: 'matheus.puppe@gmail.com',
      password: 'senha-segura',
    })

    const token = await createSession(db, user.id)
    const session = await findValidSession(db, token)

    expect(session).toMatchObject({
      userId: user.id,
      user: {
        id: user.id,
        email: 'matheus.puppe@gmail.com',
      },
    })
  })

  it('invalida sessão após logout', async () => {
    const user = await createUser(db, {
      email: 'matheus.puppe@gmail.com',
      password: 'senha-segura',
    })

    const token = await createSession(db, user.id)
    await revokeSession(db, token)

    const session = await findValidSession(db, token)
    const sessionRows = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, token))

    expect(session).toBeNull()
    expect(sessionRows).toHaveLength(0)
  })

  it('ensureSeedUser cria usuário apenas uma vez', async () => {
    const first = await ensureSeedUser(db, {
      email: 'matheus.puppe@gmail.com',
      password: 'senha-segura',
    })
    const second = await ensureSeedUser(db, {
      email: 'matheus.puppe@gmail.com',
      password: 'outra-senha',
    })

    const rows = await db.select().from(users)

    expect(first.id).toBe(second.id)
    expect(rows).toHaveLength(1)
  })
})
