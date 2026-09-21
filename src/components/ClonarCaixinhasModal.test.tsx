/**
 * @vitest-environment jsdom
 */

import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { CaixinhaProgress } from '#/lib/caixinhas/types'

import { ClonarCaixinhasModal } from './ClonarCaixinhasModal'

function buildCaixinha(
  input: Partial<CaixinhaProgress> & {
    id: number
    name: string
    month: number
    year: number
  },
): CaixinhaProgress {
  return {
    targetAmountCents: 10000,
    savedCents: 0,
    remainingCents: 10000,
    percent: 0,
    completed: false,
    observacao: null,
    ...input,
  }
}

const caixinhasDeJunho: CaixinhaProgress[] = [
  buildCaixinha({ id: 1, name: 'Viagem', month: 6, year: 2026 }),
  buildCaixinha({ id: 2, name: 'Reserva', month: 6, year: 2026 }),
]

afterEach(() => {
  cleanup()
})

describe('ClonarCaixinhasModal', () => {
  it('envia o período de destino escolhido', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn().mockResolvedValue(undefined)

    render(
      <ClonarCaixinhasModal
        open
        isSaving={false}
        error={null}
        sourceMonth={6}
        sourceYear={2026}
        caixinhas={caixinhasDeJunho}
        onClose={vi.fn()}
        onSave={onSave}
      />,
    )

    expect(
      screen.getByText('Clonar 2 caixinhas para Julho/2026'),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Clonar caixinhas' }))

    expect(onSave).toHaveBeenCalledWith({
      sourceMonth: 6,
      sourceYear: 2026,
      targetMonth: 7,
      targetYear: 2026,
    })
  })

  it('avisa quais caixinhas já existem no destino', async () => {
    const user = userEvent.setup()

    render(
      <ClonarCaixinhasModal
        open
        isSaving={false}
        error={null}
        sourceMonth={6}
        sourceYear={2026}
        caixinhas={[
          ...caixinhasDeJunho,
          buildCaixinha({ id: 3, name: 'viagem', month: 7, year: 2026 }),
        ]}
        onClose={vi.fn()}
        onSave={vi.fn().mockResolvedValue(undefined)}
      />,
    )

    expect(
      screen.getByText('Clonar 1 caixinha para Julho/2026'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Já existem em Julho/2026 e serão ignoradas: Viagem'),
    ).toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText('Mês de destino'), '8')

    expect(
      screen.getByText('Clonar 2 caixinhas para Agosto/2026'),
    ).toBeInTheDocument()
    expect(screen.queryByText(/serão ignoradas/)).not.toBeInTheDocument()
  })

  it('bloqueia o clone quando o destino já tem tudo', async () => {
    const user = userEvent.setup()

    render(
      <ClonarCaixinhasModal
        open
        isSaving={false}
        error={null}
        sourceMonth={6}
        sourceYear={2026}
        caixinhas={caixinhasDeJunho}
        onClose={vi.fn()}
        onSave={vi.fn().mockResolvedValue(undefined)}
      />,
    )

    await user.selectOptions(screen.getByLabelText('Mês de destino'), '6')

    expect(
      screen.getByText('Nada para clonar em Junho/2026'),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Clonar caixinhas' }),
    ).toBeDisabled()
  })
})
