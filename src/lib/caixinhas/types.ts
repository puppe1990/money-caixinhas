export type DepositDate = {
  day: number
  month: number
  year: number
}

export type CaixinhaProgress = {
  id: number
  name: string
  month: number
  year: number
  targetAmountCents: number
  savedCents: number
  remainingCents: number
  percent: number
  completed: boolean
}

export type PeriodGroup = {
  key: string
  label: string
  month: number
  year: number
  caixinhas: CaixinhaProgress[]
  totalSavedCents: number
  totalTargetCents: number
  totalPercent: number
  totalRemainingCents: number
}

export type TransacaoHistorico = {
  id: number
  caixinhaId: number
  caixinhaName: string
  caixinhaMonth: number
  caixinhaYear: number
  amountCents: number
  day: number
  month: number
  year: number
}
