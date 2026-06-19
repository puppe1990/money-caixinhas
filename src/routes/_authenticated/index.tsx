import { createFileRoute } from '@tanstack/react-router'

import { CaixinhasApp } from '#/components/CaixinhasApp'

export const Route = createFileRoute('/_authenticated/')({
  component: Home,
})

function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white">
      <CaixinhasApp />
    </main>
  )
}
