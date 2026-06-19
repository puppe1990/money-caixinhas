import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { eq } from 'drizzle-orm'

import type { TestDatabase } from '#/db/test-db'
import { caixinhas, depositos } from '#/db/schema'
import { createUser } from '#/lib/auth/repository'
import {
  addDeposito,
  createCaixinha,
  deleteCaixinha,
  listCaixinhasWithProgress,
  listHistoricoTransacoes,
  reorderCaixinhas,
  updateCaixinha,
  updateDeposito,
  deleteDeposito,
} from './repository'

async function createTestUser(db: TestDatabase, email: string) {
  const user = await createUser(db, {
    email,
    password: 'senha-segura',
  })

  return user.id
}

describe('caixinhas repository', () => {
  let db: TestDatabase
  let userId: number

  beforeEach(async () => {
    const { createTestDb } = await import('#/db/test-db')
    db = await createTestDb()
    userId = await createTestUser(db, 'matheus.puppe@gmail.com')
  })

  afterEach(async () => {
    await db.close()
  })

  it('cria caixinha com meta para um período mês/ano', async () => {
    const caixinha = await createCaixinha(db, userId, {
      name: 'Viagem',
      targetAmountCents: 50000,
      month: 6,
      year: 2026,
    })

    expect(caixinha).toMatchObject({
      name: 'Viagem',
      targetAmountCents: 50000,
      month: 6,
      year: 2026,
      userId,
    })

    const rows = await db.select().from(caixinhas)
    expect(rows).toHaveLength(1)
  })

  it('registra depósito com dia/mês/ano e soma progresso', async () => {
    const caixinha = await createCaixinha(db, userId, {
      name: 'Reserva',
      targetAmountCents: 10000,
      month: 6,
      year: 2026,
    })

    await addDeposito(db, userId, {
      caixinhaId: caixinha.id,
      amountCents: 2500,
      day: 10,
      month: 6,
      year: 2026,
    })

    await addDeposito(db, userId, {
      caixinhaId: caixinha.id,
      amountCents: 1500,
      day: 20,
      month: 6,
      year: 2026,
    })

    const depositRows = await db
      .select()
      .from(depositos)
      .where(eq(depositos.caixinhaId, caixinha.id))

    expect(depositRows).toHaveLength(2)
    expect(depositRows[0]).toMatchObject({ day: 10, month: 6, year: 2026 })

    const list = await listCaixinhasWithProgress(db, userId)
    expect(list[0].savedCents).toBe(4000)
    expect(list[0].percent).toBe(40)
  })

  it('lista caixinhas separadas por mês/ano com progresso', async () => {
    await createCaixinha(db, userId, {
      name: 'Março A',
      targetAmountCents: 10000,
      month: 3,
      year: 2026,
    })
    await createCaixinha(db, userId, {
      name: 'Junho A',
      targetAmountCents: 20000,
      month: 6,
      year: 2026,
    })

    const list = await listCaixinhasWithProgress(db, userId)

    expect(list).toHaveLength(2)
    expect(list.map((item) => `${item.month}/${item.year}`)).toEqual([
      '3/2026',
      '6/2026',
    ])
  })

  it('lista apenas caixinhas do usuário autenticado', async () => {
    const otherUserId = await createTestUser(db, 'outro@gmail.com')

    await createCaixinha(db, userId, {
      name: 'Minha caixinha',
      targetAmountCents: 10000,
      month: 6,
      year: 2026,
    })
    await createCaixinha(db, otherUserId, {
      name: 'Caixinha de outro usuário',
      targetAmountCents: 20000,
      month: 6,
      year: 2026,
    })

    const list = await listCaixinhasWithProgress(db, userId)

    expect(list).toHaveLength(1)
    expect(list[0].name).toBe('Minha caixinha')
  })

  it('atualiza nome, meta e período da caixinha', async () => {
    const caixinha = await createCaixinha(db, userId, {
      name: 'Viagem',
      targetAmountCents: 10000,
      month: 3,
      year: 2026,
    })

    const updated = await updateCaixinha(db, userId, caixinha.id, {
      name: 'Viagem Europa',
      targetAmountCents: 25000,
      month: 7,
      year: 2026,
    })

    expect(updated).toMatchObject({
      id: caixinha.id,
      name: 'Viagem Europa',
      targetAmountCents: 25000,
      month: 7,
      year: 2026,
    })

    const list = await listCaixinhasWithProgress(db, userId)
    expect(list[0]).toMatchObject({
      name: 'Viagem Europa',
      targetAmountCents: 25000,
      month: 7,
      year: 2026,
    })
  })

  it('impede atualização de caixinha de outro usuário', async () => {
    const otherUserId = await createTestUser(db, 'outro@gmail.com')
    const caixinha = await createCaixinha(db, otherUserId, {
      name: 'Privada',
      targetAmountCents: 10000,
      month: 6,
      year: 2026,
    })

    await expect(
      updateCaixinha(db, userId, caixinha.id, {
        name: 'Invadida',
        targetAmountCents: 1,
        month: 6,
        year: 2026,
      }),
    ).rejects.toThrow('Caixinha não encontrada')
  })

  it('exclui caixinha e seus depósitos em cascata', async () => {
    const caixinha = await createCaixinha(db, userId, {
      name: 'Reserva',
      targetAmountCents: 5000,
      month: 6,
      year: 2026,
    })

    await addDeposito(db, userId, {
      caixinhaId: caixinha.id,
      amountCents: 1000,
      day: 5,
      month: 6,
      year: 2026,
    })

    await deleteCaixinha(db, userId, caixinha.id)

    const caixinhaRows = await db.select().from(caixinhas)
    const depositoRows = await db.select().from(depositos)

    expect(caixinhaRows).toHaveLength(0)
    expect(depositoRows).toHaveLength(0)
  })

  it('lança erro ao atualizar caixinha inexistente', async () => {
    await expect(
      updateCaixinha(db, userId, 999, {
        name: 'Teste',
        targetAmountCents: 1000,
        month: 1,
        year: 2026,
      }),
    ).rejects.toThrow('Caixinha não encontrada')
  })

  it('lança erro ao excluir caixinha inexistente', async () => {
    await expect(deleteCaixinha(db, userId, 999)).rejects.toThrow(
      'Caixinha não encontrada',
    )
  })

  it('atualiza valor, data e caixinha da transação', async () => {
    const caixinhaA = await createCaixinha(db, userId, {
      name: 'Reserva',
      targetAmountCents: 10000,
      month: 6,
      year: 2026,
    })
    const caixinhaB = await createCaixinha(db, userId, {
      name: 'Viagem',
      targetAmountCents: 20000,
      month: 6,
      year: 2026,
    })

    const deposito = await addDeposito(db, userId, {
      caixinhaId: caixinhaA.id,
      amountCents: 1000,
      day: 5,
      month: 6,
      year: 2026,
    })

    const updated = await updateDeposito(db, userId, deposito.id, {
      caixinhaId: caixinhaB.id,
      amountCents: 3500,
      day: 15,
      month: 7,
      year: 2026,
    })

    expect(updated).toMatchObject({
      id: deposito.id,
      caixinhaId: caixinhaB.id,
      amountCents: 3500,
      day: 15,
      month: 7,
      year: 2026,
    })

    const list = await listCaixinhasWithProgress(db, userId)
    const reserva = list.find((item) => item.id === caixinhaA.id)
    const viagem = list.find((item) => item.id === caixinhaB.id)

    expect(reserva?.savedCents).toBe(0)
    expect(viagem?.savedCents).toBe(3500)

    const historico = await listHistoricoTransacoes(db, userId)
    expect(historico[0]).toMatchObject({
      caixinhaId: caixinhaB.id,
      caixinhaName: 'Viagem',
      amountCents: 3500,
      day: 15,
      month: 7,
      year: 2026,
    })
  })

  it('lança erro ao atualizar transação inexistente', async () => {
    await expect(
      updateDeposito(db, userId, 999, {
        caixinhaId: 1,
        amountCents: 1000,
        day: 1,
        month: 6,
        year: 2026,
      }),
    ).rejects.toThrow('Transação não encontrada')
  })

  it('reordena caixinhas dentro do mesmo período', async () => {
    const primeira = await createCaixinha(db, userId, {
      name: 'A',
      targetAmountCents: 1000,
      month: 6,
      year: 2026,
    })
    const segunda = await createCaixinha(db, userId, {
      name: 'B',
      targetAmountCents: 2000,
      month: 6,
      year: 2026,
    })
    const terceira = await createCaixinha(db, userId, {
      name: 'C',
      targetAmountCents: 3000,
      month: 6,
      year: 2026,
    })

    await reorderCaixinhas(db, userId, {
      month: 6,
      year: 2026,
      orderedIds: [terceira.id, primeira.id, segunda.id],
    })

    const list = await listCaixinhasWithProgress(db, userId)
    expect(list.map((item) => item.name)).toEqual(['C', 'A', 'B'])
  })

  it('exclui transação e atualiza progresso da caixinha', async () => {
    const caixinha = await createCaixinha(db, userId, {
      name: 'Reserva',
      targetAmountCents: 10000,
      month: 6,
      year: 2026,
    })

    const deposito = await addDeposito(db, userId, {
      caixinhaId: caixinha.id,
      amountCents: 2500,
      day: 10,
      month: 6,
      year: 2026,
    })

    await deleteDeposito(db, userId, deposito.id)

    const depositRows = await db.select().from(depositos)
    const list = await listCaixinhasWithProgress(db, userId)
    const historico = await listHistoricoTransacoes(db, userId)

    expect(depositRows).toHaveLength(0)
    expect(list[0].savedCents).toBe(0)
    expect(historico).toHaveLength(0)
  })

  it('lança erro ao excluir transação inexistente', async () => {
    await expect(deleteDeposito(db, userId, 999)).rejects.toThrow(
      'Transação não encontrada',
    )
  })
})
