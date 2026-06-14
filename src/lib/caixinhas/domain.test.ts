import { describe, expect, it } from 'vitest'

import {
  calculateProgress,
  formatCentsToMoneyInput,
  formatCurrency,
  groupCaixinhasByPeriod,
  parseMoneyToCents,
  shiftPeriod,
  validateDepositDate,
  calculateDailyGoal,
  getDaysRemainingInMonth,
} from './domain'

describe('parseMoneyToCents', () => {
  it('converte valor em reais para centavos', () => {
    expect(parseMoneyToCents('150,50')).toBe(15050)
    expect(parseMoneyToCents('1.234,56')).toBe(123456)
    expect(parseMoneyToCents('10')).toBe(1000)
  })

  it('rejeita valores inválidos', () => {
    expect(() => parseMoneyToCents('')).toThrow('Valor inválido')
    expect(() => parseMoneyToCents('abc')).toThrow('Valor inválido')
    expect(() => parseMoneyToCents('-10')).toThrow('Valor inválido')
  })
})

describe('formatCurrency', () => {
  it('formata centavos em BRL', () => {
    expect(formatCurrency(15050)).toBe('R$ 150,50')
    expect(formatCurrency(0)).toBe('R$ 0,00')
  })
})

describe('formatCentsToMoneyInput', () => {
  it('converte centavos para input monetário brasileiro', () => {
    expect(formatCentsToMoneyInput(15050)).toBe('150,50')
    expect(formatCentsToMoneyInput(123456)).toBe('1.234,56')
    expect(formatCentsToMoneyInput(0)).toBe('0,00')
  })
})

describe('validateDepositDate', () => {
  it('aceita datas válidas', () => {
    expect(validateDepositDate({ day: 15, month: 6, year: 2026 })).toEqual({
      day: 15,
      month: 6,
      year: 2026,
    })
  })

  it('rejeita datas inválidas', () => {
    expect(() => validateDepositDate({ day: 31, month: 2, year: 2026 })).toThrow(
      'Data inválida',
    )
    expect(() => validateDepositDate({ day: 0, month: 6, year: 2026 })).toThrow(
      'Data inválida',
    )
  })
})

describe('calculateProgress', () => {
  it('calcula total depositado e percentual da meta', () => {
    const progress = calculateProgress({
      targetAmountCents: 10000,
      deposits: [
        { amountCents: 2500 },
        { amountCents: 1500 },
      ],
    })

    expect(progress.savedCents).toBe(4000)
    expect(progress.remainingCents).toBe(6000)
    expect(progress.percent).toBe(40)
    expect(progress.completed).toBe(false)
  })

  it('marca meta como concluída ao atingir 100%', () => {
    const progress = calculateProgress({
      targetAmountCents: 5000,
      deposits: [{ amountCents: 5000 }],
    })

    expect(progress.completed).toBe(true)
    expect(progress.percent).toBe(100)
  })
})

describe('groupCaixinhasByPeriod', () => {
  it('agrupa caixinhas por mês/ano ordenando do mais recente', () => {
    const groups = groupCaixinhasByPeriod([
      {
        id: 1,
        name: 'Viagem',
        month: 3,
        year: 2026,
        targetAmountCents: 10000,
        savedCents: 2000,
      },
      {
        id: 2,
        name: 'Reserva',
        month: 6,
        year: 2026,
        targetAmountCents: 5000,
        savedCents: 1000,
      },
      {
        id: 3,
        name: 'Presente',
        month: 3,
        year: 2026,
        targetAmountCents: 3000,
        savedCents: 500,
      },
    ])

    expect(groups).toHaveLength(2)
    expect(groups[0].label).toBe('Junho/2026')
    expect(groups[0].caixinhas).toHaveLength(1)
    expect(groups[1].label).toBe('Março/2026')
    expect(groups[1].caixinhas).toHaveLength(2)
    expect(groups[1].totalSavedCents).toBe(2500)
    expect(groups[1].totalTargetCents).toBe(13000)
    expect(groups[0].totalSavedCents).toBe(1000)
    expect(groups[0].totalTargetCents).toBe(5000)
  })
})

describe('shiftPeriod', () => {
  it('avança e retrocede mês corretamente', () => {
    expect(shiftPeriod(6, 2026, 1)).toEqual({ month: 7, year: 2026 })
    expect(shiftPeriod(6, 2026, -1)).toEqual({ month: 5, year: 2026 })
    expect(shiftPeriod(1, 2026, -1)).toEqual({ month: 12, year: 2025 })
    expect(shiftPeriod(12, 2026, 1)).toEqual({ month: 1, year: 2027 })
  })
})

describe('getDaysRemainingInMonth', () => {
  it('conta dias restantes incluindo hoje no mês atual', () => {
    const referenceDate = new Date(2026, 5, 14)

    expect(getDaysRemainingInMonth(6, 2026, referenceDate)).toBe(17)
    expect(getDaysRemainingInMonth(5, 2026, referenceDate)).toBe(0)
  })
})

describe('calculateDailyGoal', () => {
  const referenceDate = new Date(2026, 5, 14)

  it('calcula meta diária para o mês atual', () => {
    const result = calculateDailyGoal({
      remainingCents: 760_000,
      month: 6,
      year: 2026,
      referenceDate,
    })

    expect(result).toEqual({
      dailyGoalCents: 44_706,
      daysRemaining: 17,
    })
  })

  it('retorna null para meses que não são o atual', () => {
    expect(
      calculateDailyGoal({
        remainingCents: 760_000,
        month: 5,
        year: 2026,
        referenceDate,
      }),
    ).toBeNull()
  })

  it('retorna meta diária zero quando não falta nada', () => {
    expect(
      calculateDailyGoal({
        remainingCents: 0,
        month: 6,
        year: 2026,
        referenceDate,
      }),
    ).toEqual({
      dailyGoalCents: 0,
      daysRemaining: 17,
    })
  })
})
