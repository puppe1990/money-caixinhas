import { useEffect, useState } from 'react'

import { ModalCloseButton, ModalShell } from '#/components/ModalShell'
import {
  buildClonePlan,
  periodLabel,
  shiftPeriod,
} from '#/lib/caixinhas/domain'
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

type ClonarCaixinhasModalProps = {
  open: boolean
  isSaving: boolean
  error: string | null
  sourceMonth: number
  sourceYear: number
  caixinhas: CaixinhaProgress[]
  onClose: () => void
  onSave: (data: {
    sourceMonth: number
    sourceYear: number
    targetMonth: number
    targetYear: number
  }) => Promise<void>
}

export function ClonarCaixinhasModal({
  open,
  isSaving,
  error,
  sourceMonth,
  sourceYear,
  caixinhas,
  onClose,
  onSave,
}: ClonarCaixinhasModalProps) {
  const nextPeriod = shiftPeriod(sourceMonth, sourceYear, 1)
  const [targetMonth, setTargetMonth] = useState(nextPeriod.month)
  const [targetYear, setTargetYear] = useState(nextPeriod.year)

  useEffect(() => {
    if (!open) {
      return
    }

    setTargetMonth(nextPeriod.month)
    setTargetYear(nextPeriod.year)
  }, [open, nextPeriod.month, nextPeriod.year])

  if (!open) {
    return null
  }

  const source = caixinhas.filter(
    (caixinha) =>
      caixinha.month === sourceMonth && caixinha.year === sourceYear,
  )
  const target = caixinhas.filter(
    (caixinha) =>
      caixinha.month === targetMonth && caixinha.year === targetYear,
  )
  const { toClone, skipped } = buildClonePlan(source, target)
  const targetLabel = periodLabel(targetMonth, targetYear)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    await onSave({ sourceMonth, sourceYear, targetMonth, targetYear })
  }

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      labelledBy="clonar-caixinhas-title"
    >
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2
            id="clonar-caixinhas-title"
            className="text-lg font-semibold text-slate-900"
          >
            Clonar caixinhas
          </h2>
          <p className="text-sm text-slate-500">
            Copia as caixinhas de {periodLabel(sourceMonth, sourceYear)} para
            outro período, sem os depósitos
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
        <div className="grid grid-cols-2 gap-3">
          <label className="block space-y-1 text-sm">
            <span className="font-medium text-slate-700">Mês de destino</span>
            <select
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              value={targetMonth}
              onChange={(event) => setTargetMonth(Number(event.target.value))}
            >
              {MONTHS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1 text-sm">
            <span className="font-medium text-slate-700">Ano de destino</span>
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              type="number"
              min={2000}
              max={2100}
              value={targetYear}
              onChange={(event) => setTargetYear(Number(event.target.value))}
              required
            />
          </label>
        </div>

        <div className="space-y-2 rounded-xl bg-slate-50 px-3 py-3 text-sm">
          <p className="font-medium text-slate-700">
            {toClone.length === 0
              ? `Nada para clonar em ${targetLabel}`
              : `Clonar ${toClone.length} caixinha${toClone.length === 1 ? '' : 's'} para ${targetLabel}`}
          </p>
          <p className="text-slate-600">
            {toClone.length === 0
              ? 'Escolha um período de destino diferente.'
              : 'Metas, nomes e observações são copiados; os depósitos começam do zero.'}
          </p>
          {skipped.length > 0 ? (
            <p className="text-amber-700">
              Já existem em {targetLabel} e serão ignoradas:{' '}
              {skipped.map((caixinha) => caixinha.name).join(', ')}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-3 pt-2 sm:flex-row">
          <button
            type="submit"
            disabled={isSaving || toClone.length === 0}
            className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {isSaving ? 'Clonando...' : 'Clonar caixinhas'}
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
    </ModalShell>
  )
}
