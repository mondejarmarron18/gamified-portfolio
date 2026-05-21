import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: IndexPage,
})

function IndexPage() {
  return (
    <div style={{ color: '#f0c060', fontFamily: 'Cinzel, serif', padding: '2rem' }}>
      <h1>iForgeTech — bootstrap OK</h1>
      <p>Game canvas will be wired up in Phase 5.</p>
    </div>
  )
}
