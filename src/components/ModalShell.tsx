import type { ReactNode } from 'react'

type ModalShellProps = {
  open: boolean
  onClose: () => void
  labelledBy: string
  children: ReactNode
}

export function ModalShell({
  open,
  onClose,
  labelledBy,
  children,
}: ModalShellProps) {
  if (!open) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 sm:overflow-y-auto sm:p-4"
      onClick={onClose}
      role="presentation"
    >
      <div className="flex h-full items-end justify-center sm:min-h-full sm:items-center">
        <div
          className="max-h-[92dvh] w-full max-w-md overflow-y-auto overscroll-contain rounded-t-2xl border border-slate-200 bg-white p-5 shadow-xl sm:max-h-[90dvh] sm:rounded-2xl sm:p-6"
          onClick={(event) => event.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby={labelledBy}
        >
          {children}
        </div>
      </div>
    </div>
  )
}

type ModalCloseButtonProps = {
  onClose: () => void
}

export function ModalCloseButton({ onClose }: ModalCloseButtonProps) {
  return (
    <button
      type="button"
      onClick={onClose}
      className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700"
      aria-label="Fechar modal"
    >
      ✕
    </button>
  )
}
