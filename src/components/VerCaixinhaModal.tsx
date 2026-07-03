import { ModalCloseButton, ModalShell } from '#/components/ModalShell'
import { formatCurrency, periodLabel } from '#/lib/caixinhas/domain'
import type { CaixinhaProgress } from '#/lib/caixinhas/types'

type Deposito = {
  id: number
  caixinhaId: number
  amountCents: number
  day: number
  month: number
  year: number
  createdAt: string
}

type VerCaixinhaModalProps = {
  caixinha: CaixinhaProgress | null
  depositos: Deposito[]
  open: boolean
  onClose: () => void
}

function formatDepositoDate(day: number, month: number, year: number) {
  return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`
}

export function VerCaixinhaModal({
  caixinha,
  depositos,
  open,
  onClose,
}: VerCaixinhaModalProps) {
  if (!open || !caixinha) {
    return null
  }

  return (
    <ModalShell open={open} onClose={onClose} labelledBy="ver-caixinha-title">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2
            id="ver-caixinha-title"
            className="text-lg font-semibold text-slate-900"
          >
            {caixinha.name}
          </h2>
          <p className="text-sm text-slate-500">
            {periodLabel(caixinha.month, caixinha.year)}
          </p>
        </div>
        <ModalCloseButton onClose={onClose} />
      </div>

      <div className="space-y-4">
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
          <div className="mb-2 flex items-center justify-between text-sm text-slate-600">
            <span>Meta total</span>
            <span className="font-medium text-slate-900">
              {formatCurrency(caixinha.targetAmountCents)}
            </span>
          </div>

          <div className="mb-2 h-2.5 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${caixinha.percent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-sm text-slate-700">
            <span>
              {formatCurrency(caixinha.savedCents)} /{' '}
              {formatCurrency(caixinha.targetAmountCents)}
            </span>
            <span>{caixinha.percent}%</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Faltam {formatCurrency(caixinha.remainingCents)}
          </p>

          {caixinha.completed ? (
            <span className="mt-3 inline-flex rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-800">
              Concluída
            </span>
          ) : null}
        </div>

        <div>
          <h3 className="mb-1 text-sm font-medium text-slate-700">
            Observação
          </h3>
          <p className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
            {caixinha.observacao ?? 'Sem observação'}
          </p>
        </div>

        <div>
          <h3 className="mb-2 text-sm font-medium text-slate-700">Depósitos</h3>
          {depositos.length === 0 ? (
            <p className="text-sm text-slate-500">
              Nenhum depósito registrado.
            </p>
          ) : (
            <ul className="space-y-2">
              {depositos.map((deposito) => (
                <li
                  key={deposito.id}
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  <span className="text-slate-600">
                    {formatDepositoDate(
                      deposito.day,
                      deposito.month,
                      deposito.year,
                    )}
                  </span>
                  <span className="font-medium text-slate-900">
                    {formatCurrency(deposito.amountCents)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50"
        >
          Fechar
        </button>
      </div>
    </ModalShell>
  )
}
