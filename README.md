# Hyche International Management Sports Group — Site

## Current state

**Coming soon only.** The site serves a single branded coming-soon page. Full migration from the Vite+React source is pending (Phase 2).

## Stack

- [Astro](https://astro.build) (minimal template, TypeScript strict)
- Tailwind CSS 4 (`@tailwindcss/vite`)

## Commands

```bash
npm install       # install dependencies
npm run dev       # dev server at http://localhost:4321
npm run build     # production build → dist/
npm run preview   # preview the production build locally
```

## Deploy

Deploy target: **Vercel**

1. Push this repo to GitHub.
2. Import the repo in Vercel — it auto-detects Astro.
3. Framework preset: Astro (auto-detected). No env vars needed for the coming-soon page.
4. Build command: `npm run build` · Output dir: `dist`

## Phase 2

Full migration from `global_connect` (Vite+React) is a separate task. See `MIGRATION.md` once Phase 2 begins.
