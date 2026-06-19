import { useEffect, useState } from 'react'

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
        aria-labelledby="trocar-senha-title"
      >
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
            <span className="text-sm font-medium text-slate-700">
              Nova senha
            </span>
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

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {isSaving ? 'Salvando...' : 'Salvar nova senha'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
