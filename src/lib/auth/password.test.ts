import { describe, expect, it } from 'vitest'

import { hashPassword, verifyPassword } from './password'

describe('auth password', () => {
  it('gera hash diferente para a mesma senha', async () => {
    const first = await hashPassword('senha-segura')
    const second = await hashPassword('senha-segura')

    expect(first).not.toBe(second)
  })

  it('valida senha correta', async () => {
    const hash = await hashPassword('senha-segura')

    await expect(verifyPassword('senha-segura', hash)).resolves.toBe(true)
  })

  it('rejeita senha incorreta', async () => {
    const hash = await hashPassword('senha-segura')

    await expect(verifyPassword('outra-senha', hash)).resolves.toBe(false)
  })
})
