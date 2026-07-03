/**
 * @vitest-environment jsdom
 */

import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { CaixinhaProgress } from '#/lib/caixinhas/types'

import { EditCaixinhaModal } from './EditCaixinhaModal'

const caixinha: CaixinhaProgress = {
  id: 1,
  name: 'Viagem',
  month: 6,
  year: 2026,
  targetAmountCents: 150_000,
  savedCents: 0,
  remainingCents: 150_000,
  percent: 0,
  completed: false,
  observacao: 'Texto inicial',
}

afterEach(() => {
  cleanup()
})

describe('EditCaixinhaModal', () => {
  it('pré-preenche e salva observação', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn().mockResolvedValue(undefined)

    render(
      <EditCaixinhaModal
        caixinha={caixinha}
        open
        isSaving={false}
        isDeleting={false}
        error={null}
        onClose={vi.fn()}
        onSave={onSave}
        onDelete={vi.fn()}
      />,
    )

    const observacaoField = screen.getByLabelText('Observação (opcional)')
    expect(observacaoField).toHaveValue('Texto inicial')

    await user.clear(observacaoField)
    await user.type(observacaoField, 'Texto atualizado')
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }))

    expect(onSave).toHaveBeenCalledWith({
      name: 'Viagem',
      targetAmount: '1.500,00',
      month: 6,
      year: 2026,
      observacao: 'Texto atualizado',
    })
  })
})
