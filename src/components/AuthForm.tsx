import { Link } from '@tanstack/react-router'
import { useState } from 'react'

import { PasswordInput } from '#/components/PasswordInput'

type AuthMode = 'login' | 'signup'

type AuthFormProps = {
  mode: AuthMode
  title: string
  submitLabel: string
  alternateLabel: string
  alternateTo: '/login' | '/signup'
  onSubmit: (input: { email: string; password: string }) => Promise<void>
}

export function AuthForm({
  mode,
  title,
  submitLabel,
  alternateLabel,
  alternateTo,
  onSubmit,
}: AuthFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      await onSubmit({ email, password })
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Não foi possível continuar',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center p-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-wide text-emerald-700">
          Caixinhas
        </p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">{title}</h1>
        <p className="mt-2 text-sm text-slate-600">
          {mode === 'login'
            ? 'Entre para acessar suas metas financeiras.'
            : 'Crie sua conta para começar a organizar suas caixinhas.'}
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block space-y-1">
            <span className="text-sm font-medium text-slate-700">E-mail</span>
            <input
              type="email"
              name="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none ring-emerald-500 focus:ring-2"
              placeholder="seu@email.com"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-sm font-medium text-slate-700">Senha</span>
            <PasswordInput
              name="password"
              autoComplete={
                mode === 'login' ? 'current-password' : 'new-password'
              }
              required
              minLength={8}
              value={password}
              onChange={setPassword}
              placeholder="Mínimo 8 caracteres"
            />
          </label>

          {error ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Aguarde...' : submitLabel}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          {alternateLabel}{' '}
          <Link
            to={alternateTo}
            className="font-medium text-emerald-700 hover:text-emerald-800"
          >
            {alternateTo === '/login' ? 'Entrar' : 'Criar conta'}
          </Link>
        </p>
      </div>
    </div>
  )
}
