import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
} from '@tanstack/react-router'
import '@/styles/globals.css'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1, user-scalable=no' },
      { title: 'iForgeTech — Software Engineer & AI Automation' },
      { name: 'description', content: 'Explore an interactive 3D island to discover my work as a Software Engineer and AI Automation specialist.' },
      { property: 'og:title', content: 'iForgeTech — Software Engineer & AI Automation' },
      { property: 'og:description', content: 'An interactive 3D portfolio experience built with Three.js.' },
      { property: 'og:image', content: '/og-image.png' },
    ],
    links: [
      {
        rel: 'preconnect',
        href: 'https://fonts.googleapis.com',
      },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Crimson+Text:ital,wght@0,400;0,600;1,400&display=swap',
      },
    ],
  }),
  component: RootComponent,
})

function RootComponent() {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <Outlet />
        <Scripts />
      </body>
    </html>
  )
}
