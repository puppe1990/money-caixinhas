import { createServerFn } from '@tanstack/react-start'

import { db } from '#/db'
import { authMiddleware } from '#/lib/auth/middleware'
import { parseMoneyToCents } from '#/lib/caixinhas/domain'
import {
  addDepositoSchema,
  createCaixinhaSchema,
  deleteCaixinhaSchema,
  deleteDepositoSchema,
  historicoPeriodSchema,
  reorderCaixinhasSchema,
  updateCaixinhaSchema,
  updateDepositoSchema,
} from '#/lib/caixinhas/schemas'
import {
  addDeposito,
  createCaixinha,
  deleteCaixinha,
  listCaixinhasWithProgress,
  listDepositosByCaixinha,
  listHistoricoTransacoes,
  reorderCaixinhas,
  updateCaixinha,
  updateDeposito,
  deleteDeposito,
} from '#/lib/caixinhas/repository'
import { parseServerInput } from '#/lib/server/parse-input'

export const getCaixinhas = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    return listCaixinhasWithProgress(db, context.userId)
  })

export const getHistoricoTransacoes = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator((data: unknown) => parseServerInput(historicoPeriodSchema, data))
  .handler(async ({ data, context }) => {
    return listHistoricoTransacoes(db, context.userId, data)
  })

export const getDepositos = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator((data: { caixinhaId: number }) => data)
  .handler(async ({ data, context }) => {
    return listDepositosByCaixinha(db, context.userId, data.caixinhaId)
  })

export const createCaixinhaFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: unknown) => parseServerInput(createCaixinhaSchema, data))
  .handler(async ({ data, context }) => {
    const targetAmountCents = parseMoneyToCents(data.targetAmount)

    return createCaixinha(db, context.userId, {
      name: data.name,
      targetAmountCents,
      month: data.month,
      year: data.year,
    })
  })

export const addDepositoFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: unknown) => parseServerInput(addDepositoSchema, data))
  .handler(async ({ data, context }) => {
    const amountCents = parseMoneyToCents(data.amount)

    return addDeposito(db, context.userId, {
      caixinhaId: data.caixinhaId,
      amountCents,
      day: data.day,
      month: data.month,
      year: data.year,
    })
  })

export const updateCaixinhaFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: unknown) => parseServerInput(updateCaixinhaSchema, data))
  .handler(async ({ data, context }) => {
    const targetAmountCents = parseMoneyToCents(data.targetAmount)

    return updateCaixinha(db, context.userId, data.id, {
      name: data.name,
      targetAmountCents,
      month: data.month,
      year: data.year,
    })
  })

export const deleteCaixinhaFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: unknown) => parseServerInput(deleteCaixinhaSchema, data))
  .handler(async ({ data, context }) => {
    return deleteCaixinha(db, context.userId, data.id)
  })

export const updateDepositoFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: unknown) => parseServerInput(updateDepositoSchema, data))
  .handler(async ({ data, context }) => {
    const amountCents = parseMoneyToCents(data.amount)

    return updateDeposito(db, context.userId, data.id, {
      caixinhaId: data.caixinhaId,
      amountCents,
      day: data.day,
      month: data.month,
      year: data.year,
    })
  })

export const reorderCaixinhasFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: unknown) => parseServerInput(reorderCaixinhasSchema, data))
  .handler(async ({ data, context }) => {
    await reorderCaixinhas(db, context.userId, data)
    return listCaixinhasWithProgress(db, context.userId)
  })

export const deleteDepositoFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: unknown) => parseServerInput(deleteDepositoSchema, data))
  .handler(async ({ data, context }) => {
    return deleteDeposito(db, context.userId, data.id)
  })
