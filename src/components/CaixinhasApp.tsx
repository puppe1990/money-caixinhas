import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  useHydrated,
  useNavigate,
  useRouteContext,
} from '@tanstack/react-router'
import {
  ChevronLeft,
  ChevronRight,
  KeyRound,
  LogOut,
  MoreVertical,
  Plus,
  Wallet,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { EditCaixinhaModal } from '#/components/EditCaixinhaModal'
import { EditTransacaoModal } from '#/components/EditTransacaoModal'
import { NovaCaixinhaModal } from '#/components/NovaCaixinhaModal'
import { RegistrarDepositoModal } from '#/components/RegistrarDepositoModal'
import { SortableCaixinhasGrid } from '#/components/SortableCaixinhasGrid'
import { TrocarSenhaModal } from '#/components/TrocarSenhaModal'
import {
  buildPeriodGroup,
  calculateDailyGoal,
  formatCurrency,
  formatDepositDate,
  HISTORICO_PAGE_SIZE,
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
import { changePasswordFn, logoutFn } from '#/lib/auth/functions'

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
  const [historicoPage, setHistoricoPage] = useState(1)
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
  const [showTrocarSenhaModal, setShowTrocarSenhaModal] = useState(false)
  const [trocarSenhaError, setTrocarSenhaError] = useState<string | null>(null)
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const accountMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!accountMenuOpen) {
      return
    }

    function handlePointerDown(event: MouseEvent) {
      if (
        accountMenuRef.current &&
        !accountMenuRef.current.contains(event.target as Node)
      ) {
        setAccountMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)

    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [accountMenuOpen])

  const { data: caixinhas = [], isLoading } = useQuery({
    queryKey: ['caixinhas'],
    queryFn: () => getCaixinhas(),
    staleTime: 0,
    refetchOnMount: true,
  })

  useEffect(() => {
    setHistoricoPage(1)
  }, [viewMonth, viewYear])

  const { data: historicoPageData, isLoading: isLoadingHistorico } = useQuery({
    queryKey: ['historico-transacoes', viewMonth, viewYear, historicoPage],
    queryFn: () =>
      getHistoricoTransacoes({
        data: { month: viewMonth, year: viewYear, page: historicoPage },
      }),
    staleTime: 0,
    refetchOnMount: true,
  })

  useEffect(() => {
    if (!historicoPageData) {
      return
    }

    if (historicoPageData.page !== historicoPage) {
      setHistoricoPage(historicoPageData.page)
    }
  }, [historicoPageData, historicoPage])

  const historico = historicoPageData?.items ?? []
  const historicoTotal = historicoPageData?.total ?? 0
  const historicoTotalPages = historicoPageData?.totalPages ?? 0
  const historicoCurrentPage = historicoPageData?.page ?? historicoPage
  const historicoRangeStart =
    historicoTotal === 0
      ? 0
      : (historicoCurrentPage - 1) * HISTORICO_PAGE_SIZE + 1
  const historicoRangeEnd =
    historicoTotal === 0
      ? 0
      : Math.min(historicoCurrentPage * HISTORICO_PAGE_SIZE, historicoTotal)

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

  const changePasswordMutation = useMutation({
    mutationFn: changePasswordFn,
    onSuccess: async () => {
      setTrocarSenhaError(null)
      setShowTrocarSenhaModal(false)
    },
    onError: (err) => {
      setTrocarSenhaError(
        err instanceof Error ? err.message : 'Erro ao trocar senha',
      )
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

  function goToPreviousHistoricoPage() {
    setHistoricoPage((current) => Math.max(1, current - 1))
  }

  function goToNextHistoricoPage() {
    setHistoricoPage((current) =>
      historicoTotalPages === 0
        ? 1
        : Math.min(historicoTotalPages, current + 1),
    )
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
    try {
      await logoutFn()
    } catch {
      // ignora erro de rede — limpa local e redireciona mesmo assim
    }

    queryClient.clear()
    await navigate({ to: '/login' })
  }

  function openTrocarSenhaModal() {
    setTrocarSenhaError(null)
    setShowTrocarSenhaModal(true)
  }

  function closeTrocarSenhaModal() {
    if (changePasswordMutation.isPending) {
      return
    }

    setTrocarSenhaError(null)
    setShowTrocarSenhaModal(false)
  }

  async function handleChangePassword(data: {
    currentPassword: string
    newPassword: string
  }) {
    await changePasswordMutation.mutateAsync({ data })
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5 p-4 pb-28 sm:space-y-6 sm:p-6 sm:pb-6 md:p-10">
      <header className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-emerald-700 sm:text-sm">
              Metas financeiras
            </p>
            <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
              Caixinhas
            </h1>
            <p className="mt-1 truncate text-sm text-slate-500 md:hidden">
              {session.email}
            </p>
          </div>

          <div className="relative md:hidden" ref={accountMenuRef}>
            {accountMenuOpen ? (
              <button
                type="button"
                aria-label="Fechar menu da conta"
                className="fixed inset-0 z-30 bg-slate-900/20"
                onClick={() => setAccountMenuOpen(false)}
              />
            ) : null}

            <button
              type="button"
              onClick={() => setAccountMenuOpen((open) => !open)}
              className="relative z-40 inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              aria-label="Menu da conta"
              aria-expanded={accountMenuOpen}
              aria-haspopup="menu"
            >
              <MoreVertical className="h-5 w-5" />
            </button>

            {accountMenuOpen ? (
              <div
                role="menu"
                className="absolute right-0 z-40 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setAccountMenuOpen(false)
                    openTrocarSenhaModal()
                  }}
                  className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50"
                >
                  <KeyRound className="h-4 w-4" />
                  Trocar senha
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setAccountMenuOpen(false)
                    void handleLogout()
                  }}
                  className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50"
                >
                  <LogOut className="h-4 w-4" />
                  Sair
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <div className="hidden flex-wrap items-center justify-end gap-2 md:flex">
          <span className="max-w-xs truncate rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
            {session.email}
          </span>
          <button
            type="button"
            onClick={openTrocarSenhaModal}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <KeyRound className="h-4 w-4" />
            Trocar senha
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
          <button
            type="button"
            onClick={openNovaCaixinhaModal}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" />
            Nova caixinha
          </button>
          <button
            type="button"
            onClick={openDepositoModal}
            disabled={caixinhas.length === 0}
            className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
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

          <div className="flex w-full items-center justify-between gap-2 sm:w-auto">
            <button
              type="button"
              onClick={goToPreviousMonth}
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              aria-label="Mês anterior"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="min-w-32 flex-1 text-center text-sm font-semibold text-slate-900 sm:flex-none">
              {periodLabel(viewMonth, viewYear)}
            </span>
            <button
              type="button"
              onClick={goToNextMonth}
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
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
          <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-lg font-semibold text-slate-900">
                  {visibleGroup.label}
                </h3>
                <span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
                  {visibleGroup.caixinhas.length} caixinha
                  {visibleGroup.caixinhas.length === 1 ? '' : 's'}
                </span>
              </div>

              <div className="grid gap-2 sm:flex sm:flex-wrap">
                <span className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700">
                  Geral: {formatCurrency(visibleGroup.totalSavedCents)} /{' '}
                  {formatCurrency(visibleGroup.totalTargetCents)} ·{' '}
                  {visibleGroup.totalPercent}%
                </span>
                {hydrated && dailyGoal ? (
                  <span className="rounded-xl bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">
                    {dailyGoal.dailyGoalCents === 0
                      ? 'Meta diária: concluída'
                      : `Meta diária: ${formatCurrency(dailyGoal.dailyGoalCents)} · ${dailyGoal.daysRemaining} dia${dailyGoal.daysRemaining === 1 ? '' : 's'}`}
                  </span>
                ) : null}
              </div>
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
            {periodLabel(viewMonth, viewYear)} · {historicoTotal} registro
            {historicoTotal === 1 ? '' : 's'}
          </span>
        </div>

        {isLoadingHistorico ? (
          <p className="text-slate-600">Carregando histórico...</p>
        ) : historicoTotal === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-600">
            Nenhuma transação em {periodLabel(viewMonth, viewYear)}.{' '}
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
          <>
            <div className="space-y-3 md:hidden">
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
                        {periodLabel(
                          transacao.caixinhaMonth,
                          transacao.caixinhaYear,
                        )}
                      </p>
                    </div>
                    <p className="shrink-0 text-base font-semibold text-emerald-700">
                      {formatCurrency(transacao.amountCents)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openEditTransacaoModal(transacao)}
                    className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-100"
                  >
                    Editar transação
                  </button>
                </article>
              ))}
            </div>

            <div className="hidden overflow-x-auto md:block">
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
                          className="inline-flex min-h-10 items-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-100"
                        >
                          Editar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {historicoTotalPages > 1 ? (
              <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-500">
                  Mostrando {historicoRangeStart}–{historicoRangeEnd} de{' '}
                  {historicoTotal}
                </p>
                <div className="flex items-center justify-between gap-2 sm:justify-end">
                  <button
                    type="button"
                    onClick={goToPreviousHistoricoPage}
                    disabled={historicoCurrentPage <= 1}
                    className="inline-flex min-h-11 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Página anterior"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </button>
                  <span className="min-w-28 text-center text-sm text-slate-600">
                    Página {historicoCurrentPage} de {historicoTotalPages}
                  </span>
                  <button
                    type="button"
                    onClick={goToNextHistoricoPage}
                    disabled={historicoCurrentPage >= historicoTotalPages}
                    className="inline-flex min-h-11 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Próxima página"
                  >
                    Próxima
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : null}
          </>
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

      <TrocarSenhaModal
        open={showTrocarSenhaModal}
        isSaving={changePasswordMutation.isPending}
        error={trocarSenhaError}
        onClose={closeTrocarSenhaModal}
        onSave={handleChangePassword}
      />

      <nav
        aria-label="Ações principais"
        className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur md:hidden"
      >
        <div className="grid grid-cols-2 gap-2 p-3">
          <button
            type="button"
            onClick={openNovaCaixinhaModal}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" />
            Nova caixinha
          </button>
          <button
            type="button"
            onClick={openDepositoModal}
            disabled={caixinhas.length === 0}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Wallet className="h-4 w-4" />
            Depósito
          </button>
        </div>
      </nav>
    </div>
  )
}
