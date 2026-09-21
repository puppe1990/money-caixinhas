/**
 * @vitest-environment jsdom
 */

import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { MoneyInputWithCalculator } from './MoneyInputWithCalculator'

afterEach(() => {
  cleanup()
})

describe('MoneyInputWithCalculator', () => {
  it('renderiza input de valor com botão de calculadora', () => {
    render(
      <MoneyInputWithCalculator
        value=""
        onChange={vi.fn()}
        placeholder="250,00"
      />,
    )

    expect(screen.getByLabelText('Valor (R$)')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Abrir calculadora' }),
    ).toBeInTheDocument()
  })

  it('abre calculadora e aplica resultado no campo', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    render(
      <MoneyInputWithCalculator
        value=""
        onChange={onChange}
        placeholder="250,00"
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Abrir calculadora' }))
    expect(
      screen.getByRole('dialog', { name: 'Calculadora' }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '2' }))
    await user.click(screen.getByRole('button', { name: '5' }))
    await user.click(screen.getByRole('button', { name: '0' }))
    await user.click(screen.getByRole('button', { name: 'Somar' }))
    await user.click(screen.getByRole('button', { name: '1' }))
    await user.click(screen.getByRole('button', { name: '2' }))
    await user.click(screen.getByRole('button', { name: '5' }))
    await user.click(screen.getByRole('button', { name: 'Usar resultado' }))

    expect(onChange).toHaveBeenCalledWith('375,00')
    expect(
      screen.queryByRole('dialog', { name: 'Calculadora' }),
    ).not.toBeInTheDocument()
  })

  it('permite fechar a calculadora sem alterar o valor', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    render(<MoneyInputWithCalculator value="250,00" onChange={onChange} />)

    await user.click(screen.getByRole('button', { name: 'Abrir calculadora' }))
    await user.click(screen.getByRole('button', { name: 'Fechar calculadora' }))

    expect(onChange).not.toHaveBeenCalled()
    expect(
      screen.queryByRole('dialog', { name: 'Calculadora' }),
    ).not.toBeInTheDocument()
  })

  it('aplica cálculo colado direto no campo', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    render(<MoneyInputWithCalculator value="" onChange={onChange} />)

    await user.click(screen.getByLabelText('Valor (R$)'))
    await user.paste('1.500,00 + 250')

    expect(onChange).toHaveBeenCalledWith('1.750,00')
    expect(screen.getByRole('status')).toHaveTextContent(
      'Cálculo colado: 1.500,00 + 250 = 1.750,00',
    )
  })

  it('mantém a colagem quando não é um cálculo', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    render(<MoneyInputWithCalculator value="" onChange={onChange} />)

    await user.click(screen.getByLabelText('Valor (R$)'))
    await user.paste('250,00')

    expect(onChange).toHaveBeenCalledWith('250,00')
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})
