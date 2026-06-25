import { useState } from 'react'

import {
  formatCurrency,
  formatDepositDate,
  periodLabel,
} from '#/lib/caixinhas/domain'
import type { TransacaoHistorico } from '#/lib/caixinhas/types'

type HistoricoTransacoesListProps = {
  historico: TransacaoHistorico[]
  isDeleting?: boolean
  deletingTransacaoId?: number | null
  onEdit: (transacao: TransacaoHistorico) => void
  onDelete: (transacao: TransacaoHistorico) => Promise<void>
}

export function HistoricoTransacoesList({
  historico,
  isDeleting = false,
  deletingTransacaoId = null,
  onEdit,
  onDelete,
}: HistoricoTransacoesListProps) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)

  async function handleDeleteClick(transacao: TransacaoHistorico) {
    if (confirmDeleteId !== transacao.id) {
      setConfirmDeleteId(transacao.id)
      return
    }

    await onDelete(transacao)
    setConfirmDeleteId(null)
  }

  function renderDeleteButton(
    transacao: TransacaoHistorico,
    className: string,
  ) {
    const isConfirming = confirmDeleteId === transacao.id
    const isDeletingThis = isDeleting && deletingTransacaoId === transacao.id

    return (
      <button
        type="button"
        onClick={() => void handleDeleteClick(transacao)}
        disabled={isDeleting}
        className={className}
      >
        {isDeletingThis
          ? 'Excluindo...'
          : isConfirming
            ? 'Confirmar exclusão'
            : 'Excluir'}
      </button>
    )
  }

  return (
    <>
      <div
        className="space-y-3 md:hidden"
        data-testid="historico-transacoes-mobile"
      >
        {historico.map((transacao) => (
          <article
            key={transacao.id}
            className="rounded-xl border border-slate-100 bg-slate-50 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-slate-900">
                  {transacao.caixinhaName}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {formatDepositDate(
                    transacao.day,
                    transacao.month,
                    transacao.year,
                  )}
                </p>
                <p className="text-sm text-slate-500">
                  {periodLabel(transacao.caixinhaMonth, transacao.caixinhaYear)}
                </p>
              </div>
              <p className="shrink-0 text-base font-semibold text-emerald-700">
                {formatCurrency(transacao.amountCents)}
              </p>
            </div>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => onEdit(transacao)}
                className="inline-flex min-h-11 flex-1 items-center justify-center rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Editar transação
              </button>
              {renderDeleteButton(
                transacao,
                'inline-flex min-h-11 flex-1 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-60',
              )}
            </div>
          </article>
        ))}
      </div>

      <div
        className="hidden overflow-x-auto md:block"
        data-testid="historico-transacoes-desktop"
      >
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="px-3 py-2 font-medium">Data</th>
              <th className="px-3 py-2 font-medium">Caixinha</th>
              <th className="px-3 py-2 font-medium">Período</th>
              <th className="px-3 py-2 text-right font-medium">Valor</th>
              <th className="px-3 py-2 text-right font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {historico.map((transacao) => (
              <tr
                key={transacao.id}
                className="border-b border-slate-100 last:border-0"
              >
                <td className="px-3 py-3 text-slate-700">
                  {formatDepositDate(
                    transacao.day,
                    transacao.month,
                    transacao.year,
                  )}
                </td>
                <td className="px-3 py-3 font-medium text-slate-900">
                  {transacao.caixinhaName}
                </td>
                <td className="px-3 py-3 text-slate-600">
                  {periodLabel(transacao.caixinhaMonth, transacao.caixinhaYear)}
                </td>
                <td className="px-3 py-3 text-right font-semibold text-emerald-700">
                  {formatCurrency(transacao.amountCents)}
                </td>
                <td className="px-3 py-3 text-right">
                  <div className="inline-flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onEdit(transacao)}
                      className="inline-flex min-h-10 items-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-100"
                    >
                      Editar
                    </button>
                    {renderDeleteButton(
                      transacao,
                      'inline-flex min-h-10 items-center rounded-lg border border-red-200 bg-red-50 px-3 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-60',
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
