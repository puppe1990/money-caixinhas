/**
 * @vitest-environment jsdom
 */

import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { TransacaoHistorico } from '#/lib/caixinhas/types'

import { HistoricoTransacoesList } from './HistoricoTransacoesList'

const transacao: TransacaoHistorico = {
  id: 1,
  caixinhaId: 10,
  caixinhaName: 'Creche',
  caixinhaMonth: 6,
  caixinhaYear: 2026,
  amountCents: 30000,
  day: 30,
  month: 6,
  year: 2026,
}

afterEach(() => {
  cleanup()
})

describe('HistoricoTransacoesList', () => {
  it('exibe botão Excluir ao lado de Editar na tabela desktop', () => {
    render(
      <HistoricoTransacoesList
        historico={[transacao]}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    )

    const desktop = screen.getByTestId('historico-transacoes-desktop')
    expect(
      within(desktop).getByRole('button', { name: 'Editar' }),
    ).toBeInTheDocument()
    expect(
      within(desktop).getByRole('button', { name: 'Excluir' }),
    ).toBeInTheDocument()
  })

  it('exige confirmação antes de excluir transação', async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn().mockResolvedValue(undefined)

    render(
      <HistoricoTransacoesList
        historico={[transacao]}
        onEdit={vi.fn()}
        onDelete={onDelete}
      />,
    )

    const desktop = screen.getByTestId('historico-transacoes-desktop')
    const deleteButton = within(desktop).getByRole('button', {
      name: 'Excluir',
    })

    await user.click(deleteButton)
    expect(onDelete).not.toHaveBeenCalled()
    expect(
      within(desktop).getByRole('button', { name: 'Confirmar exclusão' }),
    ).toBeInTheDocument()

    await user.click(
      within(desktop).getByRole('button', { name: 'Confirmar exclusão' }),
    )
    expect(onDelete).toHaveBeenCalledWith(transacao)
  })
})
