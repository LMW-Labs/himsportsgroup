# Migration Inventory — Global Connect → Hyche International (Astro)

Source: `C:/Users/teamw/mydev/global_connect/` (Vite + React)
Target: `C:/Users/teamw/mydev/himsportsgroup/` (Astro + Tailwind 4 + TypeScript strict)

---

## 1. Routes

| Current (React Router) | Proposed Astro path | Notes |
|---|---|---|
| `/` | `src/pages/index.astro` | Rebuild as full homepage; currently coming-soon |
| `/athletes` | `src/pages/athletes/index.astro` | Landing with filter/roster island |
| `/athletes/basketball` | `src/pages/athletes/basketball.astro` | Sport sub-page |
| `/athletes/nil` | `src/pages/athletes/nil.astro` | NIL info page |
| `/athletes/:slug` | `src/pages/athletes/[slug].astro` | Dynamic profile; data from Supabase at build or SSR |
| `/brands` | `src/pages/brands.astro` | Static landing page |
| `/about` | `src/pages/about.astro` | Mostly static with framer-motion islands |
| `/about/team` | `src/pages/about/team.astro` | Coming-soon state page |
| `/news` | `src/pages/news/index.astro` | Article list; data from Supabase |
| `/news/:slug` | `src/pages/news/[slug].astro` | Article detail; data from Supabase |
| `/contact` | `src/pages/contact.astro` | Contact form island + Supabase |
| `/careers` | `src/pages/careers.astro` | Coming-soon state page (static) |
| `/privacy` | `src/pages/privacy.astro` | Static; noindex meta |
| `/terms` | `src/pages/terms.astro` | Static; noindex meta |
| `*` (404) | `src/pages/404.astro` | Astro native 404 |
| `/admin/*` | Defer — see Admin note below | All admin routes deferred to Phase 4 |

**Admin note:** The admin section (login, dashboard, athletes CRUD, news editor, inquiries, partners, settings) is a full interactive SPA. Recommended approach: mount it as a `client:only="react"` island at `/admin` rather than porting 11 routes individually. Defer to a dedicated admin phase after public pages are live.

---

## 2. Components

### Layout

| File | Classification | Reason | Client directive |
|---|---|---|---|
| `layout/Nav.jsx` | ISLAND | useState (scrolled, dropdown, menuOpen), useEffect (scroll listener), framer-motion AnimatePresence, dropdown timer logic | `client:load` |
| `layout/Footer.jsx` | STATIC | Pure rendering, no hooks, no event handlers | — → port to `Footer.astro` |
| `layout/SplashScreen.jsx` | ISLAND | useState + useEffect timeout, framer-motion entry/exit, sessionStorage gate | `client:load` |

### Sections (homepage)

| File | Classification | Reason | Client directive |
|---|---|---|---|
| `sections/Hero.jsx` | ISLAND | Canvas animation loop, useScroll/useTransform/useSpring, custom text-scramble effect, multiple useEffect | `client:load` |
| `sections/StatsBar.jsx` | ISLAND | Counter animation via setInterval, useInView scroll trigger | `client:visible` |
| `sections/PillarCards.jsx` | ISLAND | framer-motion useInView scroll trigger, whileHover transforms | `client:visible` |
| `sections/ServicesSection.jsx` | ISLAND | framer-motion useInView scroll trigger, whileHover box-shadow transitions | `client:visible` |
| `sections/FounderStrip.jsx` | ISLAND | framer-motion useInView scroll trigger, staggered entry animations | `client:visible` |

### Athletes

| File | Classification | Reason | Client directive |
|---|---|---|---|
| `athlete/AthleteCard.jsx` | ISLAND | framer-motion whileHover, initial/animate card entry, hover-reveal overlay | `client:visible` |
| `athlete/AthleteFilters.jsx` | ISLAND | useState for filter state, search input, sort, mobile collapse, framer-motion AnimatePresence | `client:load` |

### News

| File | Classification | Reason | Client directive |
|---|---|---|---|
| `news/ArticleCard.jsx` | ISLAND | framer-motion motion.div + motion.img whileHover, staggered entry | `client:visible` |

### Pages (public)

| File | Classification | Notes |
|---|---|---|
| `pages/Home.jsx` | Orchestrator → `index.astro` | Assembles section islands; shell becomes static Astro |
| `pages/Athletes.jsx` | Orchestrator → `athletes/index.astro` | Shell static, AthleteFilters + AthleteCard islands |
| `pages/AthleteRoster.jsx` | Orchestrator → `athletes/basketball.astro` | Shell static |
| `pages/AthleteNIL.jsx` | Orchestrator → `athletes/nil.astro` | Likely mostly static copy |
| `pages/AthleteProfile.jsx` | Orchestrator → `athletes/[slug].astro` | Dynamic route; shell static, interactive bits island |
| `pages/Brands.jsx` | STATIC → `brands.astro` | No interactivity, pure copy/layout |
| `pages/About.jsx` | Orchestrator → `about.astro` | FounderStrip + timeline islands; shell static |
| `pages/Team.jsx` | STATIC → `about/team.astro` | Coming-soon state, no interactivity |
| `pages/News.jsx` | Orchestrator → `news/index.astro` | Shell static, ArticleCard islands |
| `pages/Article.jsx` | Orchestrator → `news/[slug].astro` | Shell static, rich-text body rendered at build |
| `pages/Contact.jsx` | Orchestrator → `contact.astro` | Shell static, contact form island |
| `pages/Careers.jsx` | STATIC → `careers.astro` | Coming-soon state, no interactivity |
| `pages/Privacy.jsx` | STATIC → `privacy.astro` | Static copy, noindex |
| `pages/Terms.jsx` | STATIC → `terms.astro` | Static copy, noindex |
| `pages/NotFound.jsx` | STATIC → `404.astro` | Astro native 404 page |
| `pages/BrandService.jsx` | REMOVE | No route in App.jsx — dead file |
| `pages/NILCalculator.jsx` | REMOVE | No route in App.jsx — dead file |

### Admin pages (all deferred)

All 11 admin pages (`AdminLogin`, `AdminDashboard`, `Athletes`, `AthleteForm`, `News`, `ArticleEditor`, `Videos`, `Inquiries`, `Partners`, `Settings`, `AdminLayout`) — **DEFER**. Mount as a single `client:only="react"` React SPA island under `/admin`. Requires auth gate via Supabase session.

---

## 3. Assets

| Source path | Target path | Action |
|---|---|---|
| `public/assets/logo.png` | `public/logo.png` | Already copied (Phase 1) |
| `public/favicon.svg` | `public/favicon.svg` | Already copied (Phase 1) |
| `public/favicon.ico` | `public/favicon.ico` | Already exists |
| `public/assets/hyche_portrait.png` | `public/assets/hyche_portrait.png` | Copy |
| `public/assets/action.jpg` | `src/assets/action.jpg` | Move to `src/assets/` for Astro `<Image>` optimization |
| `public/assets/animal.jpeg` | `src/assets/animal.jpeg` | Move to `src/assets/` for optimization |
| `public/assets/community_event.jpg` | `src/assets/community_event.jpg` | Move to `src/assets/` for optimization |
| `public/assets/with_lakers_owner.jpg` | `src/assets/with_lakers_owner.jpg` | Move to `src/assets/` for optimization |
| `public/assets/shield-video.mp4` | `public/assets/shield-video.mp4` | Keep in `public/` (videos bypass Astro optimizer) |
| `public/icons.svg` | `public/icons.svg` | Copy — sprite sheet referenced throughout |
| `public/assets/athletes/*.jpg/png/webp` | `public/assets/athletes/` | Keep in `public/` — referenced by Supabase data at runtime |
| Google Fonts (Bebas Neue, Rajdhani, DM Sans) | `<link>` in BaseLayout head | No file copy needed; already loaded via CDN |

**Image strategy:** Content images (action, about, community) move to `src/assets/` and use Astro's `<Image>` component for automatic WebP conversion and width/height. Athlete photos stay in `public/` since paths come from the Supabase database at runtime and can't be statically imported.

---

## 4. Dependencies

| Package | Disposition | Replacement / Notes |
|---|---|---|
| `react` | KEEP | Required for all island components |
| `react-dom` | KEEP | Required for island hydration |
| `framer-motion` | KEEP | Used in every animated island |
| `@supabase/supabase-js` | KEEP | Data layer; moves to `src/lib/supabase.ts` |
| `@tanstack/react-query` | KEEP | Server-state caching in islands |
| `react-hook-form` | KEEP | Contact form + admin forms |
| `@hookform/resolvers` | KEEP | Zod integration for form validation |
| `zod` | KEEP | Schema validation throughout |
| `zustand` | KEEP | Shared state between islands (e.g. auth, filters) |
| `react-player` | KEEP | Video playback island |
| `@tiptap/react` + extensions | KEEP | Rich text editor in admin (deferred) |
| `react-router-dom` | DROP | Astro has file-based routing; admin SPA gets its own internal router |
| `react-helmet-async` | DROP | Astro handles `<head>` natively via frontmatter |
| `vite` | DROP | Astro ships with Vite internally; not a direct dep |
| `@vitejs/plugin-react` | REPLACE | → `@astrojs/react` integration (add via `astro add react`) |
| `tailwindcss` (v3) | REPLACE | Already replaced with Tailwind 4 + `@tailwindcss/vite` |
| `autoprefixer` | DROP | Not needed with Tailwind 4 |
| `postcss` | DROP | Not needed with Tailwind 4 |
| `eslint` + plugins | KEEP | Port `eslint.config.*` to new project |
| `@types/react` + `@types/react-dom` | KEEP | TypeScript support for islands |

---

## 5. Proposed file structure

```
src/
  pages/
    index.astro                  # homepage (replaces coming-soon)
    brands.astro
    about.astro
    careers.astro
    privacy.astro
    terms.astro
    404.astro
    athletes/
      index.astro
      basketball.astro
      nil.astro
      [slug].astro
    about/
      team.astro
    news/
      index.astro
      [slug].astro
    contact.astro
    admin.astro                  # mounts React admin SPA as client:only island

  layouts/
    BaseLayout.astro             # <html>, <head>, fonts, global meta, BaseLayout slot
    PublicLayout.astro           # BaseLayout + Nav island + Footer static + SplashScreen island

  components/
    # Static Astro components
    Footer.astro
    # Interactive React islands
    interactive/
      Nav.tsx
      SplashScreen.tsx
      Hero.tsx
      StatsBar.tsx
      PillarCards.tsx
      ServicesSection.tsx
      FounderStrip.tsx
      AthleteCard.tsx
      AthleteFilters.tsx
      ArticleCard.tsx
      ContactForm.tsx            # extracted from Contact page
      AdminApp.tsx               # entire admin SPA (deferred)

  assets/
    action.jpg
    animal.jpeg
    community_event.jpg
    with_lakers_owner.jpg

  styles/
    global.css                   # Tailwind directives, CSS variables, font-face if any

  lib/
    supabase.ts                  # createClient — wired when env vars are ready
    siteData.ts                  # ported from siteData.js, typed interfaces
```

---

## 6. Migration order (recommended)

1. **Add `@astrojs/react`** — enables island hydration
2. **BaseLayout + PublicLayout** — shell for all public pages
3. **Footer.astro** — first STATIC port (simple, no dependencies)
4. **Static pages** — Privacy, Terms, Careers, Team, Brands (no data fetching, no islands)
5. **About** — FounderStrip island, timeline section
6. **Homepage** — Hero, StatsBar, PillarCards, ServicesSection, FounderStrip assembled
7. **Athletes index + profile** — requires Supabase integration
8. **News index + article** — requires Supabase integration
9. **Contact** — ContactForm island + Supabase
10. **Nav + SplashScreen** — mount in PublicLayout last (affects every page)
11. **Admin** — deferred; mount as `client:only` React SPA

---

## 7. Open questions (resolve before Phase 3)

1. **Output mode:** Static (`output: 'static'`) vs hybrid (`output: 'hybrid'`). If `/athletes/:slug` and `/news/:slug` pull live data from Supabase, SSR mode or `prerender: false` on those routes will be needed. Decide before wiring data layer.
2. **Admin hosting:** Admin SPA needs Supabase auth. If admin stays at `/admin` in the same Astro deploy, the Vercel project needs `output: 'server'` or `hybrid`. Alternative: separate Vercel project for admin only.
3. **Redirects:** Vercel `vercel.json` redirect rules may be needed to forward old Vite URLs to new Astro paths if the domain switches before full migration.
