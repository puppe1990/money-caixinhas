import { z } from 'zod'

export const createCaixinhaSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  targetAmount: z.string().min(1, 'Meta obrigatória'),
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
})

export const addDepositoSchema = z.object({
  caixinhaId: z.coerce.number().int().positive(),
  amount: z.string().min(1, 'Valor obrigatório'),
  day: z.coerce.number().int().min(1).max(31),
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
})

export const updateCaixinhaSchema = createCaixinhaSchema.extend({
  id: z.coerce.number().int().positive(),
})

export const deleteCaixinhaSchema = z.object({
  id: z.coerce.number().int().positive(),
})

export const reorderCaixinhasSchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
  orderedIds: z.array(z.coerce.number().int().positive()).min(1),
})

export const historicoPeriodSchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
  page: z.coerce.number().int().min(1).default(1),
})

export const deleteDepositoSchema = z.object({
  id: z.coerce.number().int().positive(),
})

export const updateDepositoSchema = addDepositoSchema.extend({
  id: z.coerce.number().int().positive(),
})
