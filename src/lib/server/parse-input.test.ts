import { describe, expect, it } from 'vitest'
import { z } from 'zod'

import { formatZodIssues, parseServerInput } from './parse-input'

describe('parseServerInput', () => {
  const schema = z.object({
    id: z.coerce.number().int().positive(),
    amount: z.string().min(1, 'Valor obrigatório'),
  })

  it('aceita números enviados como string', () => {
    expect(
      parseServerInput(schema, {
        id: '12',
        amount: '565,55',
      }),
    ).toEqual({
      id: 12,
      amount: '565,55',
    })
  })

  it('lança Error legível em vez de ZodError', () => {
    expect(() =>
      parseServerInput(schema, {
        id: 'abc',
        amount: '',
      }),
    ).toThrow(Error)

    try {
      parseServerInput(schema, {
        id: 'abc',
        amount: '',
      })
    } catch (error) {
      expect(error).toBeInstanceOf(Error)
      expect(error).not.toHaveProperty('issues')
      expect((error as Error).message).toContain('transação')
      expect((error as Error).message).toContain('Valor obrigatório')
    }
  })
})

describe('formatZodIssues', () => {
  it('traduz campos conhecidos para mensagens amigáveis', () => {
    expect(
      formatZodIssues([
        {
          path: ['caixinhaId'],
          message: 'Invalid input: expected number, received string',
        },
      ]),
    ).toBe('Campo "caixinha" inválido')
  })
})
