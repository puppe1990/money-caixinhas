import { and, asc, desc, eq, sql } from 'drizzle-orm'
import type { LibSQLDatabase } from 'drizzle-orm/libsql'

import { caixinhas, depositos } from '#/db/schema'
import type * as schema from '#/db/schema'

import { calculateProgress, validateDepositDate } from './domain'
import type { CaixinhaProgress, TransacaoHistorico } from './types'

type Database = LibSQLDatabase<typeof schema>

async function getCaixinhaForUser(
  db: Database,
  userId: number,
  caixinhaId: number,
) {
  const [row] = await db
    .select()
    .from(caixinhas)
    .where(and(eq(caixinhas.id, caixinhaId), eq(caixinhas.userId, userId)))

  if (!row) {
    throw new Error('Caixinha não encontrada')
  }

  return row
}

async function getDepositoForUser(
  db: Database,
  userId: number,
  depositoId: number,
) {
  const [row] = await db
    .select({ deposito: depositos })
    .from(depositos)
    .innerJoin(caixinhas, eq(depositos.caixinhaId, caixinhas.id))
    .where(and(eq(depositos.id, depositoId), eq(caixinhas.userId, userId)))

  if (!row) {
    throw new Error('Transação não encontrada')
  }

  return row.deposito
}

export async function createCaixinha(
  db: Database,
  userId: number,
  input: {
    name: string
    targetAmountCents: number
    month: number
    year: number
  },
) {
  const [orderRow] = await db
    .select({
      maxOrder: sql<number>`coalesce(max(${caixinhas.sortOrder}), -1)`,
    })
    .from(caixinhas)
    .where(
      and(
        eq(caixinhas.userId, userId),
        eq(caixinhas.month, input.month),
        eq(caixinhas.year, input.year),
      ),
    )

  const [created] = await db
    .insert(caixinhas)
    .values({
      userId,
      name: input.name.trim(),
      targetAmountCents: input.targetAmountCents,
      month: input.month,
      year: input.year,
      sortOrder: (orderRow?.maxOrder ?? -1) + 1,
    })
    .returning()

  return created
}

export async function addDeposito(
  db: Database,
  userId: number,
  input: {
    caixinhaId: number
    amountCents: number
    day: number
    month: number
    year: number
  },
) {
  await getCaixinhaForUser(db, userId, input.caixinhaId)

  validateDepositDate({
    day: input.day,
    month: input.month,
    year: input.year,
  })

  const [created] = await db
    .insert(depositos)
    .values({
      caixinhaId: input.caixinhaId,
      amountCents: input.amountCents,
      day: input.day,
      month: input.month,
      year: input.year,
    })
    .returning()

  return created
}

export async function updateDeposito(
  db: Database,
  userId: number,
  id: number,
  input: {
    caixinhaId: number
    amountCents: number
    day: number
    month: number
    year: number
  },
) {
  await getDepositoForUser(db, userId, id)
  await getCaixinhaForUser(db, userId, input.caixinhaId)

  validateDepositDate({
    day: input.day,
    month: input.month,
    year: input.year,
  })

  const [updated] = await db
    .update(depositos)
    .set({
      caixinhaId: input.caixinhaId,
      amountCents: input.amountCents,
      day: input.day,
      month: input.month,
      year: input.year,
    })
    .where(eq(depositos.id, id))
    .returning()

  if (!updated) {
    throw new Error('Transação não encontrada')
  }

  return updated
}

export async function deleteDeposito(db: Database, userId: number, id: number) {
  await getDepositoForUser(db, userId, id)

  const [deleted] = await db
    .delete(depositos)
    .where(eq(depositos.id, id))
    .returning()

  if (!deleted) {
    throw new Error('Transação não encontrada')
  }

  return deleted
}

export async function updateCaixinha(
  db: Database,
  userId: number,
  id: number,
  input: {
    name: string
    targetAmountCents: number
    month: number
    year: number
  },
) {
  await getCaixinhaForUser(db, userId, id)

  const [updated] = await db
    .update(caixinhas)
    .set({
      name: input.name.trim(),
      targetAmountCents: input.targetAmountCents,
      month: input.month,
      year: input.year,
    })
    .where(and(eq(caixinhas.id, id), eq(caixinhas.userId, userId)))
    .returning()

  if (!updated) {
    throw new Error('Caixinha não encontrada')
  }

  return updated
}

export async function deleteCaixinha(db: Database, userId: number, id: number) {
  await getCaixinhaForUser(db, userId, id)

  const [deleted] = await db
    .delete(caixinhas)
    .where(and(eq(caixinhas.id, id), eq(caixinhas.userId, userId)))
    .returning()

  if (!deleted) {
    throw new Error('Caixinha não encontrada')
  }

  return deleted
}

export async function reorderCaixinhas(
  db: Database,
  userId: number,
  input: { month: number; year: number; orderedIds: number[] },
) {
  const periodRows = await db
    .select({ id: caixinhas.id })
    .from(caixinhas)
    .where(
      and(
        eq(caixinhas.userId, userId),
        eq(caixinhas.month, input.month),
        eq(caixinhas.year, input.year),
      ),
    )

  const periodIds = new Set(periodRows.map((row) => row.id))
  const orderedSet = new Set(input.orderedIds)

  if (
    orderedSet.size !== input.orderedIds.length ||
    orderedSet.size !== periodIds.size ||
    !input.orderedIds.every((id) => periodIds.has(id))
  ) {
    throw new Error('Ordem inválida para o período')
  }

  await Promise.all(
    input.orderedIds.map((id, index) =>
      db
        .update(caixinhas)
        .set({ sortOrder: index })
        .where(and(eq(caixinhas.id, id), eq(caixinhas.userId, userId))),
    ),
  )
}

export async function listCaixinhasWithProgress(
  db: Database,
  userId: number,
): Promise<CaixinhaProgress[]> {
  const rows = await db
    .select({
      id: caixinhas.id,
      name: caixinhas.name,
      month: caixinhas.month,
      year: caixinhas.year,
      targetAmountCents: caixinhas.targetAmountCents,
      savedCents: sql<number>`coalesce(sum(${depositos.amountCents}), 0)`,
    })
    .from(caixinhas)
    .leftJoin(depositos, eq(depositos.caixinhaId, caixinhas.id))
    .where(eq(caixinhas.userId, userId))
    .groupBy(caixinhas.id)
    .orderBy(
      asc(caixinhas.year),
      asc(caixinhas.month),
      asc(caixinhas.sortOrder),
      asc(caixinhas.name),
    )

  return rows.map((row) => {
    const progress = calculateProgress({
      targetAmountCents: row.targetAmountCents,
      deposits: [{ amountCents: row.savedCents }],
    })

    return {
      id: row.id,
      name: row.name,
      month: row.month,
      year: row.year,
      targetAmountCents: row.targetAmountCents,
      savedCents: progress.savedCents,
      remainingCents: progress.remainingCents,
      percent: progress.percent,
      completed: progress.completed,
    }
  })
}

export async function listDepositosByCaixinha(
  db: Database,
  userId: number,
  caixinhaId: number,
) {
  await getCaixinhaForUser(db, userId, caixinhaId)

  return db
    .select()
    .from(depositos)
    .where(eq(depositos.caixinhaId, caixinhaId))
    .orderBy(asc(depositos.year), asc(depositos.month), asc(depositos.day))
}

export async function listHistoricoTransacoes(
  db: Database,
  userId: number,
): Promise<TransacaoHistorico[]> {
  const rows = await db
    .select({
      id: depositos.id,
      caixinhaId: depositos.caixinhaId,
      caixinhaName: caixinhas.name,
      caixinhaMonth: caixinhas.month,
      caixinhaYear: caixinhas.year,
      amountCents: depositos.amountCents,
      day: depositos.day,
      month: depositos.month,
      year: depositos.year,
    })
    .from(depositos)
    .innerJoin(caixinhas, eq(depositos.caixinhaId, caixinhas.id))
    .where(eq(caixinhas.userId, userId))
    .orderBy(
      desc(depositos.year),
      desc(depositos.month),
      desc(depositos.day),
      desc(depositos.id),
    )

  return rows
}
