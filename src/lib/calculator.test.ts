import { describe, expect, it } from 'vitest'

import {
  INITIAL_CALCULATOR_DISPLAY,
  applyEqualsToDisplay,
  backspaceCalculatorDisplay,
  calculatorResultToMoneyInput,
  clearCalculatorDisplay,
  evaluateCalculatorDisplay,
  keypadKeyFromKeyboard,
  normalizePastedExpression,
  pastedExpressionToMoneyInput,
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

describe('applyEqualsToDisplay', () => {
  it('calcula a expressão e mostra o resultado no display', () => {
    expect(applyEqualsToDisplay('250+125')).toBe('375')
    expect(applyEqualsToDisplay('10/4')).toBe('2.5')
    expect(applyEqualsToDisplay('100-25')).toBe('75')
  })

  it('rejeita expressões inválidas', () => {
    expect(() => applyEqualsToDisplay('abc')).toThrow('Expressão inválida')
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

describe('keypadKeyFromKeyboard', () => {
  it('mapeia números, operadores e vírgula do teclado', () => {
    expect(keypadKeyFromKeyboard('7')).toBe('7')
    expect(keypadKeyFromKeyboard('+')).toBe('+')
    expect(keypadKeyFromKeyboard('-')).toBe('-')
    expect(keypadKeyFromKeyboard('*')).toBe('*')
    expect(keypadKeyFromKeyboard('/')).toBe('/')
    expect(keypadKeyFromKeyboard('x')).toBe('*')
    expect(keypadKeyFromKeyboard('×')).toBe('*')
    expect(keypadKeyFromKeyboard('÷')).toBe('/')
    expect(keypadKeyFromKeyboard(',')).toBe('.')
    expect(keypadKeyFromKeyboard('.')).toBe('.')
  })

  it('mapeia teclas de ação', () => {
    expect(keypadKeyFromKeyboard('Enter')).toBe('equals')
    expect(keypadKeyFromKeyboard('=')).toBe('equals')
    expect(keypadKeyFromKeyboard('Backspace')).toBe('backspace')
    expect(keypadKeyFromKeyboard('Delete')).toBe('C')
    expect(keypadKeyFromKeyboard('c')).toBe('C')
    expect(keypadKeyFromKeyboard('C')).toBe('C')
  })

  it('ignora teclas sem função na calculadora', () => {
    expect(keypadKeyFromKeyboard('Escape')).toBeNull()
    expect(keypadKeyFromKeyboard('a')).toBeNull()
    expect(keypadKeyFromKeyboard('ArrowUp')).toBeNull()
  })
})

describe('normalizePastedExpression', () => {
  it('converte números brasileiros para o formato do cálculo', () => {
    expect(normalizePastedExpression('1.500,00 + 250')).toBe('1500.00+250')
  })

  it('ignora textos que não são cálculos', () => {
    expect(normalizePastedExpression('250,00')).toBeNull()
    expect(normalizePastedExpression('paguei 250 reais')).toBeNull()
    expect(normalizePastedExpression('')).toBeNull()
  })
})

describe('pastedExpressionToMoneyInput', () => {
  it('calcula expressões coladas e formata como valor', () => {
    expect(pastedExpressionToMoneyInput('1500+250')).toBe('1.750,00')
    expect(pastedExpressionToMoneyInput('1.500,00 + 250,50')).toBe('1.750,50')
  })

  it('aceita x, ×, ÷, = e R$ vindos da colagem', () => {
    expect(pastedExpressionToMoneyInput('12 x 12 =')).toBe('144,00')
    expect(pastedExpressionToMoneyInput('100 ÷ 4')).toBe('25,00')
    expect(pastedExpressionToMoneyInput('R$ 1.234,56 - 34,56')).toBe('1.200,00')
  })

  it('retorna null quando a colagem não é um cálculo válido', () => {
    expect(pastedExpressionToMoneyInput('250,00')).toBeNull()
    expect(pastedExpressionToMoneyInput('paguei 250 reais')).toBeNull()
    expect(pastedExpressionToMoneyInput('10/0')).toBeNull()
    expect(pastedExpressionToMoneyInput('100-250')).toBeNull()
  })
})
