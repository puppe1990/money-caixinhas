import { useEffect, useState } from 'react'

import { ModalCloseButton, ModalShell } from '#/components/ModalShell'
import {
  formatCentsToMoneyInput,
  periodLabel,
  shiftPeriod,
} from '#/lib/caixinhas/domain'
import type {
  CaixinhaProgress,
  TransacaoHistorico,
} from '#/lib/caixinhas/types'

import { DayPicker } from './DayPicker'
import { MoneyInputWithCalculator } from './MoneyInputWithCalculator'

const MONTHS = [
  { value: 1, label: 'Janeiro' },
  { value: 2, label: 'Fevereiro' },
  { value: 3, label: 'Março' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Maio' },
  { value: 6, label: 'Junho' },
  { value: 7, label: 'Julho' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Setembro' },
  { value: 10, label: 'Outubro' },
  { value: 11, label: 'Novembro' },
  { value: 12, label: 'Dezembro' },
]

type EditTransacaoModalProps = {
  transacao: TransacaoHistorico | null
  caixinhas: CaixinhaProgress[]
  open: boolean
  isSaving: boolean
  isDeleting: boolean
  error: string | null
  onClose: () => void
  onSave: (data: {
    caixinhaId: number
    amount: string
    day: number
    month: number
    year: number
  }) => Promise<void>
  onDelete: () => Promise<void>
}

export function EditTransacaoModal({
  transacao,
  caixinhas,
  open,
  isSaving,
  isDeleting,
  error,
  onClose,
  onSave,
  onDelete,
}: EditTransacaoModalProps) {
  const [caixinhaId, setCaixinhaId] = useState<number | null>(null)
  const [amount, setAmount] = useState('')
  const [day, setDay] = useState(1)
  const [month, setMonth] = useState(1)
  const [year, setYear] = useState(new Date().getFullYear())
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (!transacao || !open) {
      return
    }

    setCaixinhaId(transacao.caixinhaId)
    setAmount(formatCentsToMoneyInput(transacao.amountCents))
    setDay(transacao.day)
    setMonth(transacao.month)
    setYear(transacao.year)
    setConfirmDelete(false)
  }, [transacao, open])

  if (!open || !transacao) {
    return null
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    if (!caixinhaId) {
      return
    }

    await onSave({
      caixinhaId,
      amount,
      day,
      month,
      year,
    })
  }

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }

    await onDelete()
  }

  return (
    <ModalShell open={open} onClose={onClose} labelledBy="edit-transacao-title">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2
            id="edit-transacao-title"
            className="text-lg font-semibold text-slate-900"
          >
            Editar transação
          </h2>
          <p className="text-sm text-slate-500">
            {transacao.caixinhaName} ·{' '}
            {periodLabel(transacao.caixinhaMonth, transacao.caixinhaYear)}
          </p>
        </div>
        <ModalCloseButton onClose={onClose} />
      </div>

      {error ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block space-y-1 text-sm">
          <span className="font-medium text-slate-700">Caixinha</span>
          <select
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
            value={caixinhaId ?? ''}
            onChange={(event) =>
              setCaixinhaId(
                event.target.value ? Number(event.target.value) : null,
              )
            }
            required
          >
            <option value="">Selecione</option>
            {caixinhas.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} ({item.month}/{item.year})
              </option>
            ))}
          </select>
        </label>

        <div className="block space-y-1 text-sm">
          <label
            htmlFor="transacao-valor"
            className="font-medium text-slate-700"
          >
            Valor (R$)
          </label>
          <MoneyInputWithCalculator
            id="transacao-valor"
            value={amount}
            onChange={setAmount}
            required
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-700">Data</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1 text-sm">
              <span className="font-medium text-slate-700">Mês</span>
              <select
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                value={month}
                onChange={(event) => setMonth(Number(event.target.value))}
              >
                {MONTHS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1 text-sm">
              <span className="font-medium text-slate-700">Ano</span>
              <input
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                type="number"
                min={2000}
                max={2100}
                value={year}
                onChange={(event) => setYear(Number(event.target.value))}
                required
              />
            </label>
          </div>

          <DayPicker
            selectedDay={day}
            month={month}
            year={year}
            onSelectDay={setDay}
            onPrevMonth={() => {
              const prev = shiftPeriod(month, year, -1)
              setMonth(prev.month)
              setYear(prev.year)
            }}
            onNextMonth={() => {
              const next = shiftPeriod(month, year, 1)
              setMonth(next.month)
              setYear(next.year)
            }}
          />
        </div>

        <div className="flex flex-col gap-3 pt-2 sm:flex-row">
          <button
            type="submit"
            disabled={isSaving || isDeleting}
            className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {isSaving ? 'Salvando...' : 'Salvar alterações'}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving || isDeleting}
            className="rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            Cancelar
          </button>
        </div>
      </form>

      <div className="mt-6 border-t border-slate-200 pt-4">
        <button
          type="button"
          onClick={handleDelete}
          disabled={isSaving || isDeleting}
          className="w-full rounded-lg border border-red-200 bg-red-50 px-4 py-2 font-medium text-red-700 hover:bg-red-100 disabled:opacity-60"
        >
          {isDeleting
            ? 'Excluindo...'
            : confirmDelete
              ? 'Confirmar exclusão'
              : 'Excluir transação'}
        </button>
        {confirmDelete ? (
          <p className="mt-2 text-center text-xs text-red-600">
            O valor será removido do progresso da caixinha.
          </p>
        ) : null}
      </div>
    </ModalShell>
  )
}
