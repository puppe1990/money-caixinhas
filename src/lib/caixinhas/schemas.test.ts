import { describe, expect, it } from 'vitest'
import { toCrossJSONAsync } from 'seroval'
import { ZodError } from 'zod'

import { parseMoneyToCents } from '#/lib/caixinhas/domain'
import {
  createCaixinhaSchema,
  updateCaixinhaSchema,
  updateDepositoSchema,
} from '#/lib/caixinhas/schemas'
import { parseServerInput } from '#/lib/server/parse-input'

describe('createCaixinhaSchema', () => {
  const validPayload = {
    name: 'Viagem',
    targetAmount: '1.500,00',
    month: 6,
    year: 2026,
  }

  it('aceita observação opcional', () => {
    const parsed = parseServerInput(createCaixinhaSchema, {
      ...validPayload,
      observacao: 'Guardar para férias em julho',
    })

    expect(parsed.observacao).toBe('Guardar para férias em julho')
  })

  it('aceita payload sem observação', () => {
    const parsed = parseServerInput(createCaixinhaSchema, validPayload)

    expect(parsed.observacao).toBeUndefined()
  })

  it('rejeita observação acima de 500 caracteres', () => {
    expect(() =>
      parseServerInput(createCaixinhaSchema, {
        ...validPayload,
        observacao: 'a'.repeat(501),
      }),
    ).toThrow()
  })
})

describe('updateCaixinhaSchema', () => {
  const validPayload = {
    id: 1,
    name: 'Viagem',
    targetAmount: '1.500,00',
    month: 6,
    year: 2026,
    observacao: 'Atualizar meta em agosto',
  }

  it('aceita observação opcional na edição', () => {
    const parsed = parseServerInput(updateCaixinhaSchema, validPayload)

    expect(parsed.observacao).toBe('Atualizar meta em agosto')
  })
})

describe('updateDepositoSchema', () => {
  const validPayload = {
    id: 7,
    caixinhaId: 2,
    amount: '565,55',
    day: 29,
    month: 6,
    year: 2026,
  }

  it('valida payload de edição da transação Creche', () => {
    const parsed = parseServerInput(updateDepositoSchema, validPayload)

    expect(parsed).toEqual(validPayload)
    expect(parseMoneyToCents(parsed.amount)).toBe(56555)
  })

  it('aceita ids numéricos serializados como string', () => {
    const parsed = parseServerInput(updateDepositoSchema, {
      ...validPayload,
      id: '7',
      caixinhaId: '2',
      day: '29',
      month: '6',
      year: '2026',
    })

    expect(parsed).toEqual(validPayload)
  })

  it('lança Error serializável quando a validação falha', async () => {
    let validationError: Error | null = null

    try {
      parseServerInput(updateDepositoSchema, {
        ...validPayload,
        id: 'abc',
      })
    } catch (error) {
      validationError = error as Error
    }

    expect(validationError).toBeInstanceOf(Error)
    expect(validationError).not.toBeInstanceOf(ZodError)
    expect(validationError?.message).toContain('transação')

    const serialized = await toCrossJSONAsync(validationError, {
      refs: new Map(),
      plugins: [],
    })

    expect(serialized.m).toContain('transação')
  })
})
