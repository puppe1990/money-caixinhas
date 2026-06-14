import { useEffect, useState } from 'react'

import { periodLabel } from '#/lib/caixinhas/domain'

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

type NovaCaixinhaModalProps = {
  open: boolean
  isSaving: boolean
  error: string | null
  defaultMonth: number
  defaultYear: number
  onClose: () => void
  onSave: (data: {
    name: string
    targetAmount: string
    month: number
    year: number
  }) => Promise<void>
}

export function NovaCaixinhaModal({
  open,
  isSaving,
  error,
  defaultMonth,
  defaultYear,
  onClose,
  onSave,
}: NovaCaixinhaModalProps) {
  const [name, setName] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [month, setMonth] = useState(defaultMonth)
  const [year, setYear] = useState(defaultYear)

  useEffect(() => {
    if (!open) {
      return
    }

    setName('')
    setTargetAmount('')
    setMonth(defaultMonth)
    setYear(defaultYear)
  }, [open, defaultMonth, defaultYear])

  if (!open) {
    return null
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    await onSave({ name, targetAmount, month, year })
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
        aria-labelledby="nova-caixinha-title"
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h2
              id="nova-caixinha-title"
              className="text-lg font-semibold text-slate-900"
            >
              Nova caixinha
            </h2>
            <p className="text-sm text-slate-500">
              Período sugerido: {periodLabel(defaultMonth, defaultYear)}
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block space-y-1 text-sm">
            <span className="font-medium text-slate-700">Nome</span>
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ex: Viagem, Reserva"
              required
            />
          </label>

          <label className="block space-y-1 text-sm">
            <span className="font-medium text-slate-700">Meta total (R$)</span>
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              value={targetAmount}
              onChange={(event) => setTargetAmount(event.target.value)}
              placeholder="1.500,00"
              required
            />
          </label>

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

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {isSaving ? 'Salvando...' : 'Criar caixinha'}
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
      </div>
    </div>
  )
}
