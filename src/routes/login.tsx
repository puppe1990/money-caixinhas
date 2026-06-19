import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'

import { AuthForm } from '#/components/AuthForm'
import { getSessionFn, loginFn } from '#/lib/auth/functions'

export const Route = createFileRoute('/login')({
  beforeLoad: async () => {
    const session = await getSessionFn()

    if (session) {
      throw redirect({ to: '/' })
    }
  },
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()

  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white">
      <AuthForm
        mode="login"
        title="Entrar"
        submitLabel="Entrar"
        alternateLabel="Ainda não tem conta?"
        alternateTo="/signup"
        onSubmit={async ({ email, password }) => {
          await loginFn({ data: { email, password } })
          await navigate({ to: '/' })
        }}
      />
    </main>
  )
}
