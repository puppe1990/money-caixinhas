/**
 * @vitest-environment jsdom
 */

import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { NovaCaixinhaModal } from './NovaCaixinhaModal'

afterEach(() => {
  cleanup()
})

describe('NovaCaixinhaModal', () => {
  it('envia observação no onSave', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn().mockResolvedValue(undefined)

    render(
      <NovaCaixinhaModal
        open
        isSaving={false}
        error={null}
        defaultMonth={6}
        defaultYear={2026}
        onClose={vi.fn()}
        onSave={onSave}
      />,
    )

    await user.type(screen.getByLabelText('Nome'), 'Viagem')
    await user.type(screen.getByLabelText('Meta total (R$)'), '1500,00')
    await user.type(
      screen.getByLabelText('Observação (opcional)'),
      'Guardar para férias',
    )
    await user.click(screen.getByRole('button', { name: 'Criar caixinha' }))

    expect(onSave).toHaveBeenCalledWith({
      name: 'Viagem',
      targetAmount: '1500,00',
      month: 6,
      year: 2026,
      observacao: 'Guardar para férias',
    })
  })

  it('aplica resultado da calculadora na meta', async () => {
    const user = userEvent.setup()

    render(
      <NovaCaixinhaModal
        open
        isSaving={false}
        error={null}
        defaultMonth={6}
        defaultYear={2026}
        onClose={vi.fn()}
        onSave={vi.fn().mockResolvedValue(undefined)}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Abrir calculadora' }))
    await user.click(screen.getByRole('button', { name: '2' }))
    await user.click(screen.getByRole('button', { name: '5' }))
    await user.click(screen.getByRole('button', { name: '0' }))
    await user.click(screen.getByRole('button', { name: 'Somar' }))
    await user.click(screen.getByRole('button', { name: '1' }))
    await user.click(screen.getByRole('button', { name: '2' }))
    await user.click(screen.getByRole('button', { name: '5' }))
    await user.click(screen.getByRole('button', { name: 'Usar resultado' }))

    expect(screen.getByLabelText('Meta total (R$)')).toHaveValue('375,00')
  })
})
