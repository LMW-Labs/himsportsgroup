# Hyche International Management Sports Group — Claude Scope

## Project Overview
Boutique NIL and athlete representation agency site for Christopher Hyche (former Harlem Globetrotter). Built in Astro + React + Supabase, deployed on Vercel.

## Tech Stack
- **Framework**: Astro 6 with `@astrojs/react` for interactive islands
- **Styling**: Tailwind CSS v4 (via `@tailwindcss/vite`), plus per-component inline styles and `<style>` blocks
- **Database**: Supabase (`PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`)
- **Email**: Resend API (`RESEND_API_KEY`) — edge function at `api/send-email.ts`
- **Deployment**: Vercel (edge functions in `api/`)
- **Fonts**: Bebas Neue, Rajdhani, DM Sans (loaded via BaseLayout)

## Key Files & Paths
- `src/pages/index.astro` — **Coming Soon** page (swap with staging content to launch)
- `src/pages/staging.astro` — Full production homepage (has `noindex={true}` — remove on launch)
- `src/layouts/PublicLayout.astro` — Nav + Footer wrapper for all content pages
- `src/layouts/BaseLayout.astro` — Bare layout (used only by coming-soon)
- `src/components/interactive/Nav.tsx` — Fixed nav with dropdowns + mobile menu
- `src/components/interactive/NILAgreement.tsx` — Full NIL signing portal (admin + athlete)
- `api/send-email.ts` — Resend email edge function (admin notification + athlete confirmation)
- `api/create-agreement.ts` — Server-side PIN check + Supabase insert (PIN never exposed to client)
- `api/telegram.js` — Telegram bot webhook handler

## Design Tokens (used consistently across all components)
```
bg:      #0A0C10   (darkest background)
surface: #0E1220   (card backgrounds)
brand:   #1A72E8   (blue — primary CTA, active states)
accent:  #C85010   (orange — secondary CTA, eyebrows)
silver:  #A8BDD0   (body text)
chrome:  #D8E8F4   (headings, bright text)
```

## Supabase Tables
- `inquiries` — contact form submissions (name, email, type, message)
- `athletes` — athlete profiles (published, featured, slug, sport, position, photo_url, bio, social handles)
- `articles` — news/blog (published, slug, title, excerpt, body, featured_image, author, published_at)
- `nil_agreements` — NIL signing portal (athlete_name, effective_date, term_years, agreement_url_token, status, signature_data, signed_at, ip_address, athlete_email)

## Environment Variables
```
PUBLIC_SUPABASE_URL         — Supabase project URL
PUBLIC_SUPABASE_ANON_KEY    — Supabase anon key (safe to expose)
ADMIN_PIN                   — NIL agreement admin PIN (server-side only — do NOT use PUBLIC_)
ADMIN_EMAIL                 — Chris's notification email
RESEND_API_KEY              — Resend API key for transactional email
```

## Site Structure (all routes)
- `/` — Coming Soon (to be replaced with staging content at launch)
- `/staging` — Full homepage (noindex until launch)
- `/about` — Founder bio, timeline, gallery, values
- `/about/team` — Placeholder ("More Faces Coming Soon")
- `/athletes` — Overview with sport category cards
- `/athletes/basketball` — Hardcoded roster (10 players)
- `/athletes/nil` — NIL practice page with FAQ
- `/athletes/[slug]` — Dynamic athlete profiles (Supabase-driven)
- `/brands` — Brand partnership page
- `/contact` — Contact form (athlete/brand/media tabs) → writes to `inquiries`
- `/news` — Article list (Supabase-driven, graceful empty state)
- `/news/[slug]` — Article detail
- `/nil-agreement` — NIL signing portal (admin: `?admin=true` not needed — no token = admin view; athlete: `?token=UUID`)
- `/careers` — Placeholder
- `/privacy`, `/terms` — Legal pages

## Pre-Launch Checklist
1. Replace `src/pages/index.astro` with staging content (remove `noindex`)
2. Add `gc-logo.png` to `/public/` (Nav falls back to text currently)
3. Align stats across: HeroSection.tsx (5 athletes), contact.astro sidebar (50+), athletes/nil.astro ($12M+)

## NIL Agreement Flow
- No token in URL → admin PIN view → admin form → Supabase insert via `/api/create-agreement` → copy signing link
- Token in URL → load from Supabase → athlete reads agreement, signs canvas, submits → PDF generated client-side → email sent with PDF attachment via `/api/send-email`

## Conventions
- React islands use `client:load` directive
- All page `<style>` blocks are scoped (Astro default)
- Inline styles used in React components (no CSS modules)
- `clamp()` for responsive typography throughout
- Scroll reveal via IntersectionObserver `.reveal` / `.reveal.visible` pattern
