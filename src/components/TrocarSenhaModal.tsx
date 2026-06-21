import { useEffect, useState } from 'react'

import { ModalCloseButton, ModalShell } from '#/components/ModalShell'
import { PasswordInput } from '#/components/PasswordInput'

type TrocarSenhaModalProps = {
  open: boolean
  isSaving: boolean
  error: string | null
  onClose: () => void
  onSave: (data: {
    currentPassword: string
    newPassword: string
  }) => Promise<void>
}

export function TrocarSenhaModal({
  open,
  isSaving,
  error,
  onClose,
  onSave,
}: TrocarSenhaModalProps) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      return
    }

    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setLocalError(null)
  }, [open])

  if (!open) {
    return null
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setLocalError(null)

    if (newPassword !== confirmPassword) {
      setLocalError('A confirmação da nova senha não confere')
      return
    }

    if (currentPassword === newPassword) {
      setLocalError('A nova senha deve ser diferente da atual')
      return
    }

    await onSave({ currentPassword, newPassword })
  }

  const displayError = localError ?? error

  return (
    <ModalShell open={open} onClose={onClose} labelledBy="trocar-senha-title">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2
            id="trocar-senha-title"
            className="text-xl font-semibold text-slate-900"
          >
            Trocar senha
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Informe a senha atual e escolha uma nova senha com pelo menos 8
            caracteres.
          </p>
        </div>
        <ModalCloseButton onClose={onClose} />
      </div>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <label className="block space-y-1">
          <span className="text-sm font-medium text-slate-700">
            Senha atual
          </span>
          <PasswordInput
            autoComplete="current-password"
            required
            value={currentPassword}
            onChange={setCurrentPassword}
          />
        </label>

        <label className="block space-y-1">
          <span className="text-sm font-medium text-slate-700">Nova senha</span>
          <PasswordInput
            autoComplete="new-password"
            required
            minLength={8}
            value={newPassword}
            onChange={setNewPassword}
          />
        </label>

        <label className="block space-y-1">
          <span className="text-sm font-medium text-slate-700">
            Confirmar nova senha
          </span>
          <PasswordInput
            autoComplete="new-password"
            required
            minLength={8}
            value={confirmPassword}
            onChange={setConfirmPassword}
          />
        </label>

        {displayError ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {displayError}
          </p>
        ) : null}

        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-emerald-600 px-4 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 sm:order-2"
          >
            {isSaving ? 'Salvando...' : 'Salvar nova senha'}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancelar
          </button>
        </div>
      </form>
    </ModalShell>
  )
}
