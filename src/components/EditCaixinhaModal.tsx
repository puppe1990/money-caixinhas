import { useEffect, useState } from 'react'

import { formatCentsToMoneyInput, periodLabel } from '#/lib/caixinhas/domain'
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

type EditCaixinhaModalProps = {
  caixinha: CaixinhaProgress | null
  open: boolean
  isSaving: boolean
  isDeleting: boolean
  error: string | null
  onClose: () => void
  onSave: (data: {
    name: string
    targetAmount: string
    month: number
    year: number
  }) => Promise<void>
  onDelete: () => Promise<void>
}

export function EditCaixinhaModal({
  caixinha,
  open,
  isSaving,
  isDeleting,
  error,
  onClose,
  onSave,
  onDelete,
}: EditCaixinhaModalProps) {
  const [name, setName] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [month, setMonth] = useState(1)
  const [year, setYear] = useState(new Date().getFullYear())
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (!caixinha || !open) {
      return
    }

    setName(caixinha.name)
    setTargetAmount(formatCentsToMoneyInput(caixinha.targetAmountCents))
    setMonth(caixinha.month)
    setYear(caixinha.year)
    setConfirmDelete(false)
  }, [caixinha, open])

  if (!open || !caixinha) {
    return null
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    await onSave({ name, targetAmount, month, year })
  }

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }

    await onDelete()
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
        aria-labelledby="edit-caixinha-title"
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h2
              id="edit-caixinha-title"
              className="text-lg font-semibold text-slate-900"
            >
              Editar caixinha
            </h2>
            <p className="text-sm text-slate-500">
              Período atual: {periodLabel(caixinha.month, caixinha.year)}
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
              required
            />
          </label>

          <label className="block space-y-1 text-sm">
            <span className="font-medium text-slate-700">Meta total (R$)</span>
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              value={targetAmount}
              onChange={(event) => setTargetAmount(event.target.value)}
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
                : 'Excluir caixinha'}
          </button>
          {confirmDelete ? (
            <p className="mt-2 text-center text-xs text-red-600">
              Os depósitos desta caixinha também serão removidos.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
