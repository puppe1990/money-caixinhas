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
})
