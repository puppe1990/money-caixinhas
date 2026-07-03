/**
 * @vitest-environment jsdom
 */

import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { CaixinhaProgress } from '#/lib/caixinhas/types'

import { VerCaixinhaModal } from './VerCaixinhaModal'

const caixinha: CaixinhaProgress = {
  id: 1,
  name: 'Viagem',
  month: 6,
  year: 2026,
  targetAmountCents: 150_000,
  savedCents: 50_000,
  remainingCents: 100_000,
  percent: 33,
  completed: false,
  observacao: 'Guardar para férias em julho com a família',
}

const depositos = [
  {
    id: 10,
    caixinhaId: 1,
    amountCents: 30_000,
    day: 5,
    month: 6,
    year: 2026,
    createdAt: '2026-06-05T10:00:00.000Z',
  },
  {
    id: 11,
    caixinhaId: 1,
    amountCents: 20_000,
    day: 12,
    month: 6,
    year: 2026,
    createdAt: '2026-06-12T10:00:00.000Z',
  },
]

afterEach(() => {
  cleanup()
})

describe('VerCaixinhaModal', () => {
  it('exibe detalhes completos da caixinha', () => {
    render(
      <VerCaixinhaModal
        caixinha={caixinha}
        depositos={depositos}
        open
        onClose={vi.fn()}
      />,
    )

    const modal = screen.getByRole('dialog', { name: 'Viagem' })

    expect(within(modal).getByText('Junho/2026')).toBeInTheDocument()
    expect(within(modal).getByText('Meta total')).toBeInTheDocument()
    expect(within(modal).getByText(/Faltam R\$ 1\.000,00/)).toBeInTheDocument()
    expect(within(modal).getByText('33%')).toBeInTheDocument()
    expect(within(modal).getByText('Observação')).toBeInTheDocument()
    expect(within(modal).getByText('Depósitos')).toBeInTheDocument()
    expect(
      within(modal).getByText('Guardar para férias em julho com a família'),
    ).toBeInTheDocument()
    expect(within(modal).getByText('05/06/2026')).toBeInTheDocument()
    expect(within(modal).getByText('12/06/2026')).toBeInTheDocument()
  })

  it('exibe mensagem quando não há observação', () => {
    render(
      <VerCaixinhaModal
        caixinha={{ ...caixinha, observacao: null }}
        depositos={[]}
        open
        onClose={vi.fn()}
      />,
    )

    expect(screen.getByText('Sem observação')).toBeInTheDocument()
  })

  it('fecha ao clicar em Fechar', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()

    render(
      <VerCaixinhaModal
        caixinha={caixinha}
        depositos={depositos}
        open
        onClose={onClose}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Fechar' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('não renderiza quando fechada', () => {
    render(
      <VerCaixinhaModal
        caixinha={caixinha}
        depositos={depositos}
        open={false}
        onClose={vi.fn()}
      />,
    )

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
