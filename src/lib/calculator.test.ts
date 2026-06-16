import { describe, expect, it } from 'vitest'

import {
  INITIAL_CALCULATOR_DISPLAY,
  backspaceCalculatorDisplay,
  calculatorResultToMoneyInput,
  clearCalculatorDisplay,
  evaluateCalculatorDisplay,
  pressCalculatorKey,
} from './calculator'

describe('pressCalculatorKey', () => {
  it('inicia com zero e substitui ao digitar primeiro número', () => {
    expect(pressCalculatorKey(INITIAL_CALCULATOR_DISPLAY, '5')).toBe('5')
  })

  it('concatena dígitos e operadores', () => {
    let display = pressCalculatorKey(INITIAL_CALCULATOR_DISPLAY, '2')
    display = pressCalculatorKey(display, '5')
    display = pressCalculatorKey(display, '0')
    display = pressCalculatorKey(display, '+')
    display = pressCalculatorKey(display, '1')
    display = pressCalculatorKey(display, '2')
    display = pressCalculatorKey(display, '5')

    expect(display).toBe('250+125')
  })

  it('permite ponto decimal apenas uma vez por número', () => {
    let display = pressCalculatorKey(INITIAL_CALCULATOR_DISPLAY, '1')
    display = pressCalculatorKey(display, '.')
    display = pressCalculatorKey(display, '5')
    display = pressCalculatorKey(display, '.')
    display = pressCalculatorKey(display, '+')
    display = pressCalculatorKey(display, '2')

    expect(display).toBe('1.5+2')
  })

  it('limpa o display com C', () => {
    const display = pressCalculatorKey('250+125', 'C')
    expect(display).toBe(INITIAL_CALCULATOR_DISPLAY)
  })

  it('remove último caractere com backspace', () => {
    expect(backspaceCalculatorDisplay('250+12')).toBe('250+1')
    expect(backspaceCalculatorDisplay('5')).toBe(INITIAL_CALCULATOR_DISPLAY)
    expect(backspaceCalculatorDisplay(INITIAL_CALCULATOR_DISPLAY)).toBe(
      INITIAL_CALCULATOR_DISPLAY,
    )
  })

  it('limpa o display com clearCalculatorDisplay', () => {
    expect(clearCalculatorDisplay()).toBe(INITIAL_CALCULATOR_DISPLAY)
  })
})

describe('evaluateCalculatorDisplay', () => {
  it('calcula expressões com operações básicas', () => {
    expect(evaluateCalculatorDisplay('250+125')).toBe(375)
    expect(evaluateCalculatorDisplay('100-25')).toBe(75)
    expect(evaluateCalculatorDisplay('10*3')).toBe(30)
    expect(evaluateCalculatorDisplay('100/4')).toBe(25)
  })

  it('respeita precedência de multiplicação e divisão', () => {
    expect(evaluateCalculatorDisplay('10+5*2')).toBe(20)
    expect(evaluateCalculatorDisplay('100/5+3')).toBe(23)
  })

  it('suporta decimais', () => {
    expect(evaluateCalculatorDisplay('10.5+2.5')).toBe(13)
  })

  it('rejeita expressões inválidas', () => {
    expect(() => evaluateCalculatorDisplay('')).toThrow('Expressão inválida')
    expect(() => evaluateCalculatorDisplay('abc')).toThrow('Expressão inválida')
    expect(() => evaluateCalculatorDisplay('10/0')).toThrow('Divisão por zero')
  })
})

describe('calculatorResultToMoneyInput', () => {
  it('formata resultado para input monetário brasileiro', () => {
    expect(calculatorResultToMoneyInput(375)).toBe('375,00')
    expect(calculatorResultToMoneyInput(1234.56)).toBe('1.234,56')
  })
})