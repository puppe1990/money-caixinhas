import { createFileRoute, redirect, Outlet } from '@tanstack/react-router'

import { getSessionFn } from '#/lib/auth/functions'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async () => {
    const session = await getSessionFn()

    if (!session) {
      throw redirect({ to: '/login' })
    }

    return { session }
  },
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  return <Outlet />
}
