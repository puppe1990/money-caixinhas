import { useEffect, useState } from 'react'

import type { CaixinhaProgress } from '#/lib/caixinhas/types'

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

type RegistrarDepositoModalProps = {
  open: boolean
  isSaving: boolean
  error: string | null
  caixinhas: CaixinhaProgress[]
  defaultCaixinhaId: number | null
  defaultDay: number
  defaultMonth: number
  defaultYear: number
  onClose: () => void
  onSave: (data: {
    caixinhaId: number
    amount: string
    day: number
    month: number
    year: number
  }) => Promise<void>
}

export function RegistrarDepositoModal({
  open,
  isSaving,
  error,
  caixinhas,
  defaultCaixinhaId,
  defaultDay,
  defaultMonth,
  defaultYear,
  onClose,
  onSave,
}: RegistrarDepositoModalProps) {
  const [caixinhaId, setCaixinhaId] = useState<number | null>(null)
  const [amount, setAmount] = useState('')
  const [day, setDay] = useState(defaultDay)
  const [month, setMonth] = useState(defaultMonth)
  const [year, setYear] = useState(defaultYear)

  useEffect(() => {
    if (!open) {
      return
    }

    setCaixinhaId(defaultCaixinhaId)
    setAmount('')
    setDay(defaultDay)
    setMonth(defaultMonth)
    setYear(defaultYear)
  }, [open, defaultCaixinhaId, defaultDay, defaultMonth, defaultYear])

  if (!open) {
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="registrar-deposito-title"
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h2
              id="registrar-deposito-title"
              className="text-lg font-semibold text-slate-900"
            >
              Registrar depósito
            </h2>
            <p className="text-sm text-slate-500">
              Adicione um valor à caixinha escolhida
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Fechar modal"
          >
            ✕
          </button>
        </div>

        {error ? (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {caixinhas.length === 0 ? (
          <p className="text-sm text-slate-600">
            Crie uma caixinha antes de registrar um depósito.
          </p>
        ) : (
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

            <label className="block space-y-1 text-sm">
              <span className="font-medium text-slate-700">Valor (R$)</span>
              <input
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="250,00"
                required
              />
            </label>

            <div className="grid grid-cols-3 gap-3">
              <label className="block space-y-1 text-sm">
                <span className="font-medium text-slate-700">Dia</span>
                <input
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  type="number"
                  min={1}
                  max={31}
                  value={day}
                  onChange={(event) => setDay(Number(event.target.value))}
                  required
                />
              </label>
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

            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 rounded-lg bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {isSaving ? 'Salvando...' : 'Adicionar depósito'}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
