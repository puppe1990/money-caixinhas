import type { CaixinhaProgress, DepositDate, PeriodGroup } from './types'

const MONTH_LABELS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]

export function parseMoneyToCents(value: string): number {
  const normalized = value.trim().replace(/\s/g, '')
  if (!normalized) {
    throw new Error('Valor inválido')
  }

  const digitsOnly = normalized.replace(/[^\d,.-]/g, '')
  if (!digitsOnly || !/\d/.test(digitsOnly)) {
    throw new Error('Valor inválido')
  }

  const hasComma = digitsOnly.includes(',')
  const parsed = hasComma
    ? Number(digitsOnly.replace(/\./g, '').replace(',', '.'))
    : Number(digitsOnly)

  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error('Valor inválido')
  }

  return Math.round(parsed * 100)
}

export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
    .format(cents / 100)
    .replace(/\u00a0/g, ' ')
}

export function formatCentsToMoneyInput(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function validateDepositDate(date: DepositDate): DepositDate {
  const { day, month, year } = date
  const parsed = new Date(year, month - 1, day)

  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    throw new Error('Data inválida')
  }

  return { day, month, year }
}

export function calculateProgress(input: {
  targetAmountCents: number
  deposits: Array<{ amountCents: number }>
}) {
  const savedCents = input.deposits.reduce(
    (total, deposit) => total + deposit.amountCents,
    0,
  )
  const remainingCents = Math.max(input.targetAmountCents - savedCents, 0)
  const percent =
    input.targetAmountCents === 0
      ? 0
      : Math.min(
          100,
          Math.round((savedCents / input.targetAmountCents) * 100),
        )

  return {
    savedCents,
    remainingCents,
    percent,
    completed: savedCents >= input.targetAmountCents,
  }
}

export function periodLabel(month: number, year: number): string {
  return `${MONTH_LABELS[month - 1]}/${year}`
}

export function formatDepositDate(day: number, month: number, year: number): string {
  const dayLabel = String(day).padStart(2, '0')
  const monthLabel = String(month).padStart(2, '0')
  return `${dayLabel}/${monthLabel}/${year}`
}

export function isCurrentPeriod(
  month: number,
  year: number,
  referenceDate = new Date(),
): boolean {
  return (
    referenceDate.getMonth() + 1 === month &&
    referenceDate.getFullYear() === year
  )
}

export function getDaysRemainingInMonth(
  month: number,
  year: number,
  referenceDate = new Date(),
): number {
  if (!isCurrentPeriod(month, year, referenceDate)) {
    return 0
  }

  const lastDay = new Date(year, month, 0).getDate()
  return lastDay - referenceDate.getDate() + 1
}

export function calculateDailyGoal(input: {
  remainingCents: number
  month: number
  year: number
  referenceDate?: Date
}): { dailyGoalCents: number; daysRemaining: number } | null {
  const referenceDate = input.referenceDate ?? new Date()

  if (!isCurrentPeriod(input.month, input.year, referenceDate)) {
    return null
  }

  const daysRemaining = getDaysRemainingInMonth(
    input.month,
    input.year,
    referenceDate,
  )

  if (daysRemaining <= 0) {
    return null
  }

  if (input.remainingCents <= 0) {
    return { dailyGoalCents: 0, daysRemaining }
  }

  return {
    dailyGoalCents: Math.ceil(input.remainingCents / daysRemaining),
    daysRemaining,
  }
}

export function summarizePeriod(caixinhas: CaixinhaProgress[]) {
  const totalTargetCents = caixinhas.reduce(
    (sum, caixinha) => sum + caixinha.targetAmountCents,
    0,
  )
  const totalSavedCents = caixinhas.reduce(
    (sum, caixinha) => sum + caixinha.savedCents,
    0,
  )
  const progress = calculateProgress({
    targetAmountCents: totalTargetCents,
    deposits: [{ amountCents: totalSavedCents }],
  })

  return {
    totalSavedCents,
    totalTargetCents,
    totalPercent: progress.percent,
    totalRemainingCents: progress.remainingCents,
  }
}

export function shiftPeriod(
  month: number,
  year: number,
  delta: number,
): { month: number; year: number } {
  const date = new Date(year, month - 1 + delta, 1)

  return {
    month: date.getMonth() + 1,
    year: date.getFullYear(),
  }
}

export function buildPeriodGroup(
  month: number,
  year: number,
  caixinhas: CaixinhaProgress[],
): PeriodGroup {
  const filtered = caixinhas.filter(
    (caixinha) => caixinha.month === month && caixinha.year === year,
  )

  return {
    key: `${year}-${String(month).padStart(2, '0')}`,
    label: periodLabel(month, year),
    month,
    year,
    caixinhas: filtered,
    ...summarizePeriod(filtered),
  }
}

export function groupCaixinhasByPeriod(
  caixinhas: CaixinhaProgress[],
): PeriodGroup[] {
  const grouped = new Map<string, PeriodGroup>()

  for (const caixinha of caixinhas) {
    const key = `${caixinha.year}-${String(caixinha.month).padStart(2, '0')}`
    const existing = grouped.get(key)

    if (existing) {
      existing.caixinhas.push(caixinha)
      continue
    }

    grouped.set(key, {
      key,
      label: periodLabel(caixinha.month, caixinha.year),
      month: caixinha.month,
      year: caixinha.year,
      caixinhas: [caixinha],
    })
  }

  return [...grouped.values()]
    .map((group) => ({
      ...group,
      ...summarizePeriod(group.caixinhas),
    }))
    .sort((a, b) => {
    if (a.year !== b.year) {
      return b.year - a.year
    }
    return b.month - a.month
  })
}
