import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import { db } from '#/db'
import { authMiddleware } from '#/lib/auth/middleware'
import { parseMoneyToCents } from '#/lib/caixinhas/domain'
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

const createCaixinhaSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  targetAmount: z.string().min(1, 'Meta obrigatória'),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(2100),
})

const addDepositoSchema = z.object({
  caixinhaId: z.number().int().positive(),
  amount: z.string().min(1, 'Valor obrigatório'),
  day: z.number().int().min(1).max(31),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(2100),
})

const updateCaixinhaSchema = createCaixinhaSchema.extend({
  id: z.number().int().positive(),
})

const deleteCaixinhaSchema = z.object({
  id: z.number().int().positive(),
})

const reorderCaixinhasSchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(2100),
  orderedIds: z.array(z.number().int().positive()).min(1),
})

const deleteDepositoSchema = z.object({
  id: z.number().int().positive(),
})

const updateDepositoSchema = addDepositoSchema.extend({
  id: z.number().int().positive(),
})

export const getCaixinhas = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    return listCaixinhasWithProgress(db, context.userId)
  })

export const getHistoricoTransacoes = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    return listHistoricoTransacoes(db, context.userId)
  })

export const getDepositos = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator((data: { caixinhaId: number }) => data)
  .handler(async ({ data, context }) => {
    return listDepositosByCaixinha(db, context.userId, data.caixinhaId)
  })

export const createCaixinhaFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: unknown) => createCaixinhaSchema.parse(data))
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
  .validator((data: unknown) => addDepositoSchema.parse(data))
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
  .validator((data: unknown) => updateCaixinhaSchema.parse(data))
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
  .validator((data: unknown) => deleteCaixinhaSchema.parse(data))
  .handler(async ({ data, context }) => {
    return deleteCaixinha(db, context.userId, data.id)
  })

export const updateDepositoFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: unknown) => updateDepositoSchema.parse(data))
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
  .validator((data: unknown) => reorderCaixinhasSchema.parse(data))
  .handler(async ({ data, context }) => {
    await reorderCaixinhas(db, context.userId, data)
    return listCaixinhasWithProgress(db, context.userId)
  })

export const deleteDepositoFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: unknown) => deleteDepositoSchema.parse(data))
  .handler(async ({ data, context }) => {
    return deleteDeposito(db, context.userId, data.id)
  })
