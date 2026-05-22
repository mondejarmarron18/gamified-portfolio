# Interactive 3D Portfolio

An immersive, game-like 3D portfolio built with [Three.js](https://threejs.org/), [TanStack Start](https://tanstack.com/start), React, and TypeScript. Visitors explore an interactive island scene where each object reveals a section of the portfolio.

**Live:** https://portfolio.iforgetech.com

## Features

- 3D island scene with day/night cycle, campfire, butterflies, and animated characters
- Click-to-navigate world objects that open portfolio modals (Projects, Experience, Resume, Contact)
- SSR-capable via TanStack Start with full SEO meta per route
- Modular scene architecture — each 3D object lives in its own `src/lib/scene/` module
- SPA mode for zero-server static deployment on Vercel

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Bun |
| Framework | TanStack Start (SSR / SPA) |
| UI | React 19 + TypeScript (strict) |
| Routing | TanStack Router (file-based) |
| 3D | Three.js |
| State | Zustand |
| Styling | CSS Modules + Tailwind CSS |
| Deployment | Vercel |

## Getting Started

```bash
bun install       # install dependencies
bun run dev       # dev server at http://localhost:3000
bun run build     # production build
bun run typecheck # type check
```

## Project Structure

```
src/
  routes/         # TanStack Start file-based routes
  components/
    game/         # Three.js canvas, HUD, and modal components
    ui/           # Reusable design-system primitives
  data/           # Portfolio content (projects, experience, resume)
  lib/
    scene/        # Three.js scene builders (one file per object)
    raycaster.ts  # Click-to-interact hit detection
    state.ts      # Game state store (Zustand)
  hooks/          # useGameLoop, useThreeScene, useInput
  types/          # Shared TypeScript interfaces
```

## Interactive Objects

| World Object | Opens |
|---|---|
| Sign | Experience |
| Chest | Projects |
| Gold Rock | Resume / Skills |
| Scroll | Contact |

## Updating Portfolio Content

All content lives in `src/data/` — edit the typed arrays and TypeScript will catch any shape mismatches at build time.
