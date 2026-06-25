import type { ReactNode } from 'react'

import { ModalCloseButton, ModalShell } from '#/components/ModalShell'

type ConfirmDeleteModalProps = {
  open: boolean
  title: string
  message: string
  isDeleting?: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  children?: ReactNode
}

export function ConfirmDeleteModal({
  open,
  title,
  message,
  isDeleting = false,
  onClose,
  onConfirm,
  children,
}: ConfirmDeleteModalProps) {
  function handleClose() {
    if (isDeleting) {
      return
    }

    onClose()
  }

  return (
    <ModalShell
      open={open}
      onClose={handleClose}
      labelledBy="confirm-delete-title"
    >
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2
            id="confirm-delete-title"
            className="text-lg font-semibold text-slate-900"
          >
            {title}
          </h2>
          <p className="mt-1 text-sm text-slate-600">{message}</p>
        </div>
        <ModalCloseButton onClose={handleClose} />
      </div>

      {children ? (
        <div className="mb-5 rounded-xl bg-slate-50 p-4">{children}</div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row-reverse">
        <button
          type="button"
          onClick={() => void onConfirm()}
          disabled={isDeleting}
          className="flex-1 rounded-lg border border-red-200 bg-red-50 px-4 py-2 font-medium text-red-700 hover:bg-red-100 disabled:opacity-60"
        >
          {isDeleting ? 'Excluindo...' : 'Sim, excluir'}
        </button>
        <button
          type="button"
          onClick={handleClose}
          disabled={isDeleting}
          className="rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          Cancelar
        </button>
      </div>
    </ModalShell>
  )
}
