import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'

import { AuthForm } from '#/components/AuthForm'
import { getSessionFn, signupFn } from '#/lib/auth/functions'

export const Route = createFileRoute('/signup')({
  beforeLoad: async () => {
    const session = await getSessionFn()

    if (session) {
      throw redirect({ to: '/' })
    }
  },
  component: SignupPage,
})

function SignupPage() {
  const navigate = useNavigate()

  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white">
      <AuthForm
        mode="signup"
        title="Criar conta"
        submitLabel="Cadastrar"
        alternateLabel="Já tem conta?"
        alternateTo="/login"
        onSubmit={async ({ email, password }) => {
          await signupFn({ data: { email, password } })
          await navigate({ to: '/' })
        }}
      />
    </main>
  )
}
