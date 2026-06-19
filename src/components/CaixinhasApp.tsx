import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  useHydrated,
  useNavigate,
  useRouteContext,
} from '@tanstack/react-router'
import { ChevronLeft, ChevronRight, LogOut, Plus } from 'lucide-react'
import { useState } from 'react'

import { EditCaixinhaModal } from '#/components/EditCaixinhaModal'
import { EditTransacaoModal } from '#/components/EditTransacaoModal'
import { NovaCaixinhaModal } from '#/components/NovaCaixinhaModal'
import { RegistrarDepositoModal } from '#/components/RegistrarDepositoModal'
import { SortableCaixinhasGrid } from '#/components/SortableCaixinhasGrid'
import {
  buildPeriodGroup,
  calculateDailyGoal,
  formatCurrency,
  formatDepositDate,
  periodLabel,
  shiftPeriod,
} from '#/lib/caixinhas/domain'
import type {
  CaixinhaProgress,
  TransacaoHistorico,
} from '#/lib/caixinhas/types'
import {
  addDepositoFn,
  createCaixinhaFn,
  deleteCaixinhaFn,
  deleteDepositoFn,
  getCaixinhas,
  getHistoricoTransacoes,
  reorderCaixinhasFn,
  updateCaixinhaFn,
  updateDepositoFn,
} from '#/lib/caixinhas/functions'
import { logoutFn } from '#/lib/auth/functions'

function currentPeriod() {
  const now = new Date()
  return {
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    day: now.getDate(),
  }
}

export function CaixinhasApp() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { session } = useRouteContext({ from: '/_authenticated' })
  const hydrated = useHydrated()
  const period = currentPeriod()
  const [viewMonth, setViewMonth] = useState(period.month)
  const [viewYear, setViewYear] = useState(period.year)
  const [showNovaCaixinhaModal, setShowNovaCaixinhaModal] = useState(false)
  const [showDepositoModal, setShowDepositoModal] = useState(false)
  const [editingCaixinha, setEditingCaixinha] =
    useState<CaixinhaProgress | null>(null)
  const [editingTransacao, setEditingTransacao] =
    useState<TransacaoHistorico | null>(null)
  const [novaCaixinhaError, setNovaCaixinhaError] = useState<string | null>(
    null,
  )
  const [depositoError, setDepositoError] = useState<string | null>(null)
  const [modalError, setModalError] = useState<string | null>(null)
  const [transacaoModalError, setTransacaoModalError] = useState<string | null>(
    null,
  )

  const { data: caixinhas = [], isLoading } = useQuery({
    queryKey: ['caixinhas'],
    queryFn: () => getCaixinhas(),
  })

  const { data: historico = [], isLoading: isLoadingHistorico } = useQuery({
    queryKey: ['historico-transacoes'],
    queryFn: () => getHistoricoTransacoes(),
  })

  const createMutation = useMutation({
    mutationFn: createCaixinhaFn,
    onSuccess: async () => {
      setNovaCaixinhaError(null)
      setShowNovaCaixinhaModal(false)
      await queryClient.invalidateQueries({ queryKey: ['caixinhas'] })
    },
    onError: (err) => {
      setNovaCaixinhaError(
        err instanceof Error ? err.message : 'Erro ao criar caixinha',
      )
    },
  })

  const depositMutation = useMutation({
    mutationFn: addDepositoFn,
    onSuccess: async () => {
      setDepositoError(null)
      setShowDepositoModal(false)
      await queryClient.invalidateQueries({ queryKey: ['caixinhas'] })
      await queryClient.invalidateQueries({
        queryKey: ['historico-transacoes'],
      })
    },
    onError: (err) => {
      setDepositoError(
        err instanceof Error ? err.message : 'Erro ao registrar depósito',
      )
    },
  })

  const updateMutation = useMutation({
    mutationFn: updateCaixinhaFn,
    onSuccess: async () => {
      setModalError(null)
      setEditingCaixinha(null)
      await queryClient.invalidateQueries({ queryKey: ['caixinhas'] })
      await queryClient.invalidateQueries({
        queryKey: ['historico-transacoes'],
      })
    },
    onError: (err) => {
      setModalError(
        err instanceof Error ? err.message : 'Erro ao atualizar caixinha',
      )
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteCaixinhaFn,
    onSuccess: async () => {
      setModalError(null)
      setEditingCaixinha(null)
      await queryClient.invalidateQueries({ queryKey: ['caixinhas'] })
      await queryClient.invalidateQueries({
        queryKey: ['historico-transacoes'],
      })
    },
    onError: (err) => {
      setModalError(
        err instanceof Error ? err.message : 'Erro ao excluir caixinha',
      )
    },
  })

  const updateTransacaoMutation = useMutation({
    mutationFn: updateDepositoFn,
    onSuccess: async () => {
      setTransacaoModalError(null)
      setEditingTransacao(null)
      await queryClient.invalidateQueries({ queryKey: ['caixinhas'] })
      await queryClient.invalidateQueries({
        queryKey: ['historico-transacoes'],
      })
    },
    onError: (err) => {
      setTransacaoModalError(
        err instanceof Error ? err.message : 'Erro ao atualizar transação',
      )
    },
  })

  const deleteTransacaoMutation = useMutation({
    mutationFn: deleteDepositoFn,
    onSuccess: async () => {
      setTransacaoModalError(null)
      setEditingTransacao(null)
      await queryClient.invalidateQueries({ queryKey: ['caixinhas'] })
      await queryClient.invalidateQueries({
        queryKey: ['historico-transacoes'],
      })
    },
    onError: (err) => {
      setTransacaoModalError(
        err instanceof Error ? err.message : 'Erro ao excluir transação',
      )
    },
  })

  const reorderMutation = useMutation({
    mutationFn: reorderCaixinhasFn,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['caixinhas'] })
    },
  })

  const visibleGroup = buildPeriodGroup(viewMonth, viewYear, caixinhas)
  const defaultCaixinhaId = visibleGroup.caixinhas[0]?.id ?? null
  const dailyGoal = calculateDailyGoal({
    remainingCents: visibleGroup.totalRemainingCents,
    month: viewMonth,
    year: viewYear,
  })

  function goToPreviousMonth() {
    const previous = shiftPeriod(viewMonth, viewYear, -1)
    setViewMonth(previous.month)
    setViewYear(previous.year)
  }

  function goToNextMonth() {
    const next = shiftPeriod(viewMonth, viewYear, 1)
    setViewMonth(next.month)
    setViewYear(next.year)
  }

  function openNovaCaixinhaModal() {
    setNovaCaixinhaError(null)
    setShowNovaCaixinhaModal(true)
  }

  function closeNovaCaixinhaModal() {
    if (createMutation.isPending) {
      return
    }
    setNovaCaixinhaError(null)
    setShowNovaCaixinhaModal(false)
  }

  function openDepositoModal() {
    setDepositoError(null)
    setShowDepositoModal(true)
  }

  function closeDepositoModal() {
    if (depositMutation.isPending) {
      return
    }
    setDepositoError(null)
    setShowDepositoModal(false)
  }

  async function handleCreate(data: {
    name: string
    targetAmount: string
    month: number
    year: number
  }) {
    await createMutation.mutateAsync({ data })
    setViewMonth(data.month)
    setViewYear(data.year)
  }

  async function handleDeposit(data: {
    caixinhaId: number
    amount: string
    day: number
    month: number
    year: number
  }) {
    await depositMutation.mutateAsync({ data })
  }

  function openEditModal(caixinha: CaixinhaProgress) {
    setModalError(null)
    setEditingCaixinha(caixinha)
  }

  function closeEditModal() {
    if (updateMutation.isPending || deleteMutation.isPending) {
      return
    }
    setModalError(null)
    setEditingCaixinha(null)
  }

  async function handleUpdate(data: {
    name: string
    targetAmount: string
    month: number
    year: number
  }) {
    if (!editingCaixinha) {
      return
    }

    await updateMutation.mutateAsync({
      data: {
        id: editingCaixinha.id,
        ...data,
      },
    })
  }

  async function handleDelete() {
    if (!editingCaixinha) {
      return
    }

    await deleteMutation.mutateAsync({
      data: { id: editingCaixinha.id },
    })
  }

  function openEditTransacaoModal(transacao: TransacaoHistorico) {
    setTransacaoModalError(null)
    setEditingTransacao(transacao)
  }

  function closeEditTransacaoModal() {
    if (
      updateTransacaoMutation.isPending ||
      deleteTransacaoMutation.isPending
    ) {
      return
    }
    setTransacaoModalError(null)
    setEditingTransacao(null)
  }

  async function handleUpdateTransacao(data: {
    caixinhaId: number
    amount: string
    day: number
    month: number
    year: number
  }) {
    if (!editingTransacao) {
      return
    }

    await updateTransacaoMutation.mutateAsync({
      data: {
        id: editingTransacao.id,
        ...data,
      },
    })
  }

  async function handleDeleteTransacao() {
    if (!editingTransacao) {
      return
    }

    await deleteTransacaoMutation.mutateAsync({
      data: { id: editingTransacao.id },
    })
  }

  async function handleReorder(orderedIds: number[]) {
    await reorderMutation.mutateAsync({
      data: {
        month: viewMonth,
        year: viewYear,
        orderedIds,
      },
    })
  }

  async function handleLogout() {
    await logoutFn()
    await queryClient.clear()
    await navigate({ to: '/login' })
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6 md:p-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-emerald-700">
            Metas financeiras
          </p>
          <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
            Caixinhas
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
            {session.email}
          </span>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
          <button
            type="button"
            onClick={openNovaCaixinhaModal}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" />
            Nova caixinha
          </button>
          <button
            type="button"
            onClick={openDepositoModal}
            disabled={caixinhas.length === 0}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Registrar depósito
          </button>
        </div>
      </header>

      <section className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-xl font-semibold text-slate-900">
            Caixinhas por período
          </h2>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={goToPreviousMonth}
              className="rounded-lg border border-slate-200 bg-white p-2 text-slate-700 hover:bg-slate-50"
              aria-label="Mês anterior"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="min-w-32 text-center text-sm font-semibold text-slate-900">
              {periodLabel(viewMonth, viewYear)}
            </span>
            <button
              type="button"
              onClick={goToNextMonth}
              className="rounded-lg border border-slate-200 bg-white p-2 text-slate-700 hover:bg-slate-50"
              aria-label="Próximo mês"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {isLoading ? (
          <p className="text-slate-600">Carregando caixinhas...</p>
        ) : visibleGroup.caixinhas.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-600">
            <p>Nenhuma caixinha em {periodLabel(viewMonth, viewYear)}.</p>
            <button
              type="button"
              onClick={openNovaCaixinhaModal}
              className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Criar caixinha para este mês
            </button>
          </div>
        ) : (
          <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-baseline gap-3">
                <h3 className="text-lg font-semibold text-slate-900">
                  {visibleGroup.label}
                </h3>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                  Geral: {formatCurrency(visibleGroup.totalSavedCents)} /{' '}
                  {formatCurrency(visibleGroup.totalTargetCents)} ·{' '}
                  {visibleGroup.totalPercent}%
                </span>
                {hydrated && dailyGoal ? (
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-sm font-medium text-amber-800">
                    {dailyGoal.dailyGoalCents === 0
                      ? 'Meta diária: concluída'
                      : `Meta diária: ${formatCurrency(dailyGoal.dailyGoalCents)} · ${dailyGoal.daysRemaining} dia${dailyGoal.daysRemaining === 1 ? '' : 's'}`}
                  </span>
                ) : null}
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
                {visibleGroup.caixinhas.length} caixinha
                {visibleGroup.caixinhas.length === 1 ? '' : 's'}
              </span>
            </div>

            <SortableCaixinhasGrid
              caixinhas={visibleGroup.caixinhas}
              month={viewMonth}
              year={viewYear}
              isReordering={reorderMutation.isPending}
              onReorder={handleReorder}
              onEdit={openEditModal}
            />
          </div>
        )}
      </section>

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-slate-900">
            Histórico de transações
          </h2>
          <span className="text-sm text-slate-500">
            {historico.length} registro{historico.length === 1 ? '' : 's'}
          </span>
        </div>

        {isLoadingHistorico ? (
          <p className="text-slate-600">Carregando histórico...</p>
        ) : historico.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-600">
            Nenhuma transação registrada ainda.{' '}
            <button
              type="button"
              onClick={openDepositoModal}
              disabled={caixinhas.length === 0}
              className="font-medium text-emerald-700 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
            >
              Registrar um depósito
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
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
                      {periodLabel(
                        transacao.caixinhaMonth,
                        transacao.caixinhaYear,
                      )}
                    </td>
                    <td className="px-3 py-3 text-right font-semibold text-emerald-700">
                      {formatCurrency(transacao.amountCents)}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => openEditTransacaoModal(transacao)}
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <NovaCaixinhaModal
        open={showNovaCaixinhaModal}
        isSaving={createMutation.isPending}
        error={novaCaixinhaError}
        defaultMonth={viewMonth}
        defaultYear={viewYear}
        onClose={closeNovaCaixinhaModal}
        onSave={handleCreate}
      />

      <RegistrarDepositoModal
        open={showDepositoModal}
        isSaving={depositMutation.isPending}
        error={depositoError}
        caixinhas={caixinhas}
        defaultCaixinhaId={defaultCaixinhaId}
        defaultDay={period.day}
        defaultMonth={viewMonth}
        defaultYear={viewYear}
        onClose={closeDepositoModal}
        onSave={handleDeposit}
      />

      <EditCaixinhaModal
        caixinha={editingCaixinha}
        open={editingCaixinha !== null}
        isSaving={updateMutation.isPending}
        isDeleting={deleteMutation.isPending}
        error={modalError}
        onClose={closeEditModal}
        onSave={handleUpdate}
        onDelete={handleDelete}
      />

      <EditTransacaoModal
        transacao={editingTransacao}
        caixinhas={caixinhas}
        open={editingTransacao !== null}
        isSaving={updateTransacaoMutation.isPending}
        isDeleting={deleteTransacaoMutation.isPending}
        error={transacaoModalError}
        onClose={closeEditTransacaoModal}
        onSave={handleUpdateTransacao}
        onDelete={handleDeleteTransacao}
      />
    </div>
  )
}
