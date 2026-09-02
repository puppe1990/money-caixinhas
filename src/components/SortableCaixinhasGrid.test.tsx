/**
 * @vitest-environment jsdom
 */

import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { CaixinhaProgress } from '#/lib/caixinhas/types'

import { SortableCaixinhasGrid } from './SortableCaixinhasGrid'

const baseCaixinha: CaixinhaProgress = {
  id: 1,
  name: 'Viagem',
  month: 6,
  year: 2026,
  targetAmountCents: 150_000,
  savedCents: 50_000,
  remainingCents: 100_000,
  percent: 33,
  completed: false,
  observacao: null,
}

beforeEach(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
})

afterEach(() => {
  cleanup()
})

describe('SortableCaixinhasGrid', () => {
  it('exibe prévia da observação quando existir', () => {
    const longObservacao =
      'Esta é uma observação bem longa que precisa ser cortada para caber no card da caixinha sem ocupar muito espaço'

    render(
      <SortableCaixinhasGrid
        caixinhas={[
          {
            ...baseCaixinha,
            observacao: longObservacao,
          },
        ]}
        month={6}
        year={2026}
        isReordering={false}
        onReorder={vi.fn()}
        onEdit={vi.fn()}
        onView={vi.fn()}
        onPay={vi.fn()}
      />,
    )

    const preview = screen.getByTestId('caixinha-observacao-preview')
    expect(preview.textContent).toMatch(
      /^Esta é uma observação bem longa que precisa ser cortada/,
    )
    expect(preview.textContent).toMatch(/\.\.\.$/)
  })

  it('não exibe bloco de observação quando estiver vazia', () => {
    render(
      <SortableCaixinhasGrid
        caixinhas={[baseCaixinha]}
        month={6}
        year={2026}
        isReordering={false}
        onReorder={vi.fn()}
        onEdit={vi.fn()}
        onView={vi.fn()}
        onPay={vi.fn()}
      />,
    )

    expect(
      screen.queryByTestId('caixinha-observacao-preview'),
    ).not.toBeInTheDocument()
  })

  it('chama onView ao clicar em Ver', async () => {
    const user = userEvent.setup()
    const onView = vi.fn()
    const caixinha = {
      ...baseCaixinha,
      observacao: 'Nota curta',
    }

    render(
      <SortableCaixinhasGrid
        caixinhas={[caixinha]}
        month={6}
        year={2026}
        isReordering={false}
        onReorder={vi.fn()}
        onEdit={vi.fn()}
        onView={onView}
        onPay={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Ver Viagem' }))
    expect(onView).toHaveBeenCalledWith(caixinha)
  })
})
