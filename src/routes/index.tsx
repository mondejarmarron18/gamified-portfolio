import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: IndexPage,
})

function IndexPage() {
  return (
    <div className="p-8 text-gold font-cinzel">
      <h1 className="text-4xl font-bold mb-4">iForgeTech — bootstrap OK</h1>
      <p className="text-lg">Game canvas will be wired up in Phase 5.</p>
    </div>
  )
}
