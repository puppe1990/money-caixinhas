import { formatCentsToMoneyInput } from '#/lib/caixinhas/domain'

export const INITIAL_CALCULATOR_DISPLAY = '0'

export type CalculatorKey =
  | '0'
  | '1'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | '+'
  | '-'
  | '*'
  | '/'
  | '.'
  | 'C'

export function clearCalculatorDisplay(): string {
  return INITIAL_CALCULATOR_DISPLAY
}

export function backspaceCalculatorDisplay(display: string): string {
  if (display.length <= 1 || display === INITIAL_CALCULATOR_DISPLAY) {
    return INITIAL_CALCULATOR_DISPLAY
  }

  const next = display.slice(0, -1)
  return next === '' || next === '-' ? INITIAL_CALCULATOR_DISPLAY : next
}

function lastNumberSegment(display: string): string {
  const match = display.match(/[+\-*/](?!$)([^+\-*/]*)$/)
  if (match) {
    return match[1]
  }

  return display
}

function replaceTrailingOperator(display: string, operator: string): string {
  if (/[+\-*/]$/.test(display)) {
    return display.slice(0, -1) + operator
  }

  return display + operator
}

export function pressCalculatorKey(
  display: string,
  key: CalculatorKey,
): string {
  if (key === 'C') {
    return INITIAL_CALCULATOR_DISPLAY
  }

  if (key === '.') {
    const segment = lastNumberSegment(display)
    if (segment.includes('.')) {
      return display
    }

    if (display === INITIAL_CALCULATOR_DISPLAY) {
      return '0.'
    }

    if (/[+\-*/]$/.test(display)) {
      return `${display}0.`
    }

    return `${display}.`
  }

  if (key === '+' || key === '-' || key === '*' || key === '/') {
    if (display === INITIAL_CALCULATOR_DISPLAY && key === '-') {
      return '-'
    }

    if (display === INITIAL_CALCULATOR_DISPLAY) {
      return display
    }

    return replaceTrailingOperator(display, key)
  }

  if (display === INITIAL_CALCULATOR_DISPLAY) {
    return key
  }

  if (/[+\-*/]$/.test(display)) {
    return display + key
  }

  return display + key
}

type Token =
  | { type: 'number'; value: number }
  | { type: 'operator'; value: '+' | '-' | '*' | '/' }

function tokenize(expression: string): Token[] {
  const normalized = expression.trim()
  if (!normalized || !/^[\d.+\-*/]+$/.test(normalized)) {
    throw new Error('Expressão inválida')
  }

  const tokens: Token[] = []
  let index = 0

  while (index < normalized.length) {
    const char = normalized[index]

    if (char === '+' || char === '-' || char === '*' || char === '/') {
      if (
        char === '-' &&
        (tokens.length === 0 ||
          tokens[tokens.length - 1]?.type === 'operator') &&
        /\d|\./.test(normalized[index + 1] ?? '')
      ) {
        const start = index
        index += 1
        while (index < normalized.length && /[\d.]/.test(normalized[index])) {
          index += 1
        }
        const value = Number(normalized.slice(start, index))
        if (!Number.isFinite(value)) {
          throw new Error('Expressão inválida')
        }
        tokens.push({ type: 'number', value })
        continue
      }

      tokens.push({ type: 'operator', value: char })
      index += 1
      continue
    }

    if (/\d/.test(char) || char === '.') {
      const start = index
      while (index < normalized.length && /[\d.]/.test(normalized[index])) {
        index += 1
      }
      const value = Number(normalized.slice(start, index))
      if (!Number.isFinite(value)) {
        throw new Error('Expressão inválida')
      }
      tokens.push({ type: 'number', value })
      continue
    }

    throw new Error('Expressão inválida')
  }

  if (tokens.length === 0) {
    throw new Error('Expressão inválida')
  }

  return tokens
}

function evaluateTokens(tokens: Token[]): number {
  const values: number[] = []
  const operators: Array<'+' | '-' | '*' | '/'> = []

  const applyOperator = () => {
    const operator = operators.pop()
    const right = values.pop()
    const left = values.pop()

    if (operator === undefined || right === undefined || left === undefined) {
      throw new Error('Expressão inválida')
    }

    switch (operator) {
      case '+':
        values.push(left + right)
        break
      case '-':
        values.push(left - right)
        break
      case '*':
        values.push(left * right)
        break
      case '/':
        if (right === 0) {
          throw new Error('Divisão por zero')
        }
        values.push(left / right)
        break
    }
  }

  const precedence = (operator: '+' | '-' | '*' | '/') =>
    operator === '+' || operator === '-' ? 1 : 2

  for (const token of tokens) {
    if (token.type === 'number') {
      values.push(token.value)
      continue
    }

    while (
      operators.length > 0 &&
      precedence(operators[operators.length - 1]) >= precedence(token.value)
    ) {
      applyOperator()
    }

    operators.push(token.value)
  }

  while (operators.length > 0) {
    applyOperator()
  }

  if (values.length !== 1) {
    throw new Error('Expressão inválida')
  }

  return values[0]
}

export function formatCalculatorDisplayResult(result: number): string {
  if (!Number.isFinite(result)) {
    throw new Error('Resultado inválido')
  }

  if (Number.isInteger(result)) {
    return String(result)
  }

  return Number(result.toFixed(8)).toString()
}

export function applyEqualsToDisplay(display: string): string {
  const result = evaluateCalculatorDisplay(display)
  return formatCalculatorDisplayResult(result)
}

export function evaluateCalculatorDisplay(display: string): number {
  if (!display || display === INITIAL_CALCULATOR_DISPLAY) {
    throw new Error('Expressão inválida')
  }

  const sanitized =
    display.endsWith('+') ||
    display.endsWith('-') ||
    display.endsWith('*') ||
    display.endsWith('/')
      ? display.slice(0, -1)
      : display

  if (!sanitized || sanitized === '-') {
    throw new Error('Expressão inválida')
  }

  return evaluateTokens(tokenize(sanitized))
}

export function calculatorResultToMoneyInput(result: number): string {
  if (!Number.isFinite(result) || result < 0) {
    throw new Error('Resultado inválido')
  }

  return formatCentsToMoneyInput(Math.round(result * 100))
}
