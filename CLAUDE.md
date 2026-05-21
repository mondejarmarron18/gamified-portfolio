# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Tech stack

- **Runtime**: Bun
- **Framework**: TanStack Start (SSR, file-based routing)
- **UI**: React 19 + TypeScript (strict mode)
- **Routing**: TanStack Router (type-safe, file-based)
- **3D**: Three.js (via npm, not CDN)
- **Styling**: CSS Modules or Tailwind CSS — pick one and stay consistent per component
- **SEO**: TanStack Start's built-in `<Meta>` / head management via `createFileRoute`

## Commands

```bash
bun install           # install dependencies
bun run dev           # dev server with HMR
bun run build         # production build
bun run start         # serve production build
bun run typecheck     # tsc --noEmit
bun run lint          # eslint
```

## Rules

- **TypeScript strict** — `"strict": true` in tsconfig. No `any`, no `@ts-ignore` unless there is a comment explaining why.
- **No default exports** from data files or utility modules — use named exports so tree-shaking and refactoring tooling work correctly. Default exports are fine for route components (TanStack Start convention).
- **All portfolio content lives in `src/data/`** — never hard-code project names, dates, or skills inline in components. Import from the data layer.
- **Three.js scene objects belong in hooks or vanilla TS modules** — never create `THREE.*` objects inside React render functions. Use `useRef` + `useEffect` patterns, or extract to a `src/lib/scene/` module.
- **SEO meta per route** — every `createFileRoute` that renders a page must export a `head` function returning title and description.
- **File naming**: `kebab-case` for files, `PascalCase` for React components. Route files follow TanStack Start conventions (`_layout.tsx`, `index.tsx`, etc.).

## Folder structure

```
src/
  routes/
    __root.tsx          # Root layout: fonts, global styles, providers
    index.tsx           # Game page (the Three.js portfolio experience)
  components/
    game/               # Three.js canvas + HUD + modal wrappers
      GameCanvas.tsx
      Hud.tsx
      Modal.tsx
      modals/           # One component per modal type
        ExperienceModal.tsx
        ProjectsModal.tsx
        ResumeModal.tsx
        ContactModal.tsx
    ui/                 # Reusable design-system primitives (Button, Tag, etc.)
  data/                 # Portfolio content — edit here to update the site
    projects.ts
    experience.ts
    resume.ts
    index.ts            # Re-exports all data
  lib/
    scene/              # Three.js builders (one file per scene object)
      lighting.ts
      island.ts
      player.ts
      rocks.ts
      objects.ts        # sign, chest, scroll
      rabbits.ts
      sky.ts
      textures.ts       # all CanvasTexture factories
    raycaster.ts        # castRay + hit-type union
    state.ts            # Game state (replaces the global `S` object — use a typed store)
  hooks/
    useGameLoop.ts      # requestAnimationFrame loop
    useThreeScene.ts    # scene/camera/renderer lifecycle
    useInput.ts         # mouse + touch event wiring
  types/
    game.ts             # GameState, HitResult, RockData, etc.
    portfolio.ts        # Project, ExperienceEntry, Resume interfaces
public/
  og-image.png          # Open Graph image for social sharing
app.config.ts           # TanStack Start / Vinxi config
tsconfig.json
```

## Portfolio data — how to add or update content

All three data files export typed arrays/objects. Edit them directly; TypeScript will catch shape mismatches at build time.

### `src/data/projects.ts`

```ts
import type { Project } from '@/types/portfolio'

export const projects: Project[] = [
  {
    gem: '💎',
    name: 'AI SMS Booking System',
    type: 'Full-Stack · AI Integration',
    desc: 'SMS lead qualification + appointment booking via Claude AI & GoHighLevel CRM.',
    tags: ['Node.js', 'Express', 'Claude AI', 'GoHighLevel', 'SMS'],
    liveUrl: 'https://...',
    githubUrl: 'https://...',
  },
  // add more entries here
]
```

### `src/data/experience.ts`

```ts
import type { ExperienceEntry } from '@/types/portfolio'

export const experience: ExperienceEntry[] = [
  {
    role: 'Software Engineer & AI Automation',
    company: 'iForgeTech / Freelance',
    date: '2022 – Present',
    desc: '...',
  },
]
```

### `src/data/resume.ts`

```ts
import type { Resume } from '@/types/portfolio'

export const resume: Resume = {
  skills: [
    { name: 'JavaScript / TypeScript', level: 'Expert' },
    // ...
  ],
  tools: ['Claude AI', 'GoHighLevel', ...],
  education: { degree: '...', school: '...', year: '2019' },
  contact: { email: '...', github: '...', linkedin: '...' },
}
```

## SEO pattern

Every page route must export a `head` function:

```ts
// src/routes/index.tsx
export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      { title: 'iForgeTech — Software Engineer & AI Automation' },
      { name: 'description', content: 'Explore an interactive 3D island...' },
      { property: 'og:image', content: '/og-image.png' },
    ],
  }),
  component: GamePage,
})
```

## Three.js architecture

The old `index.html` used a single monolithic script with a global `S` state object and global scene variables. The rewrite splits this into:

1. **`src/lib/state.ts`** — typed game state (replaces `S`). Use Zustand or a plain reactive store; not React state, since the game loop runs outside React's render cycle.
2. **`src/lib/scene/*.ts`** — each builder function lives in its own file, receives the `THREE.Scene` as an argument, and returns a handle object (mesh refs, update callbacks).
3. **`src/hooks/useGameLoop.ts`** — owns the `requestAnimationFrame` loop and calls per-frame updaters collected from the scene builders.
4. **`src/components/game/GameCanvas.tsx`** — mounts the renderer into a `<div ref>`, wires up resize, triggers `startGame`, unmounts cleanly.

Interactive objects map to modals exactly as before:

| World object | Scene file | Opens |
|---|---|---|
| Sign | `objects.ts` | `<ExperienceModal>` |
| Chest | `objects.ts` | `<ProjectsModal>` |
| Gold Rock | `rocks.ts` | `<ResumeModal>` |
| Scroll | `objects.ts` | `<ContactModal>` |

The `castRay` function returns a discriminated union:

```ts
type HitResult =
  | { type: 'rock'; index: number }
  | { type: 'crackedGold' }
  | { type: 'sign' }
  | { type: 'chest' }
  | { type: 'scroll' }
  | { type: 'ground'; point: THREE.Vector3 }
```

## Migration note

The original prototype is `index.html` at the repo root. Keep it as a reference during development; delete it once the TanStack Start build reaches feature parity.
