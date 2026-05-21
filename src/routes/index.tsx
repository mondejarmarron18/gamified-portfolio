import { createFileRoute } from '@tanstack/react-router'
import { GameCanvas } from '@/components/game/GameCanvas'

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      { title: 'iForgeTech — Software Engineer & AI Automation' },
      {
        name: 'description',
        content:
          'Explore an interactive 3D island portfolio. Discover projects, experience, and resume hidden across the island.',
      },
      { name: 'og:title', content: 'iForgeTech — Software Engineer & AI Automation' },
      {
        name: 'og:description',
        content: 'Interactive 3D island portfolio built with Three.js and React.',
      },
      { name: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
  }),
  component: IndexPage,
})

function IndexPage() {
  return <GameCanvas />
}
