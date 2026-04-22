-- ═══════════════════════════════════════════════════════════════════════════
-- HYCHE INTERNATIONAL MANAGEMENT SPORTS GROUP — DATABASE SCHEMA
-- Run this entire file in Supabase SQL Editor to initialize the database.
-- ═══════════════════════════════════════════════════════════════════════════


-- ─── ATHLETES ───────────────────────────────────────────────────────────────

create table if not exists public.athletes (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,
  name            text not null,
  position        text,
  sport           text not null default 'Basketball',
  school          text,
  class_year      text,
  division        text,
  status          text not null default 'nil_client'
                  check (status in ('nil_client', 'pro_prospect', 'rising_star', 'alumni')),
  photo_url       text,
  nil_value_display text,
  featured        boolean not null default false,
  published       boolean not null default false,
  bio             text,
  instagram       text,
  twitter         text,
  tiktok          text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists athletes_slug_idx      on public.athletes (slug);
create index if not exists athletes_published_idx on public.athletes (published);
create index if not exists athletes_featured_idx  on public.athletes (featured);

-- auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace trigger athletes_updated_at
  before update on public.athletes
  for each row execute function public.set_updated_at();


-- ─── ARTICLES ───────────────────────────────────────────────────────────────

create table if not exists public.articles (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,
  title           text not null,
  excerpt         text,
  body            text,
  featured_image  text,
  author          text default 'Hyche International',
  published       boolean not null default false,
  published_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists articles_slug_idx        on public.articles (slug);
create index if not exists articles_published_idx   on public.articles (published);
create index if not exists articles_published_at_idx on public.articles (published_at desc);

create or replace trigger articles_updated_at
  before update on public.articles
  for each row execute function public.set_updated_at();


-- ─── INQUIRIES ──────────────────────────────────────────────────────────────

create table if not exists public.inquiries (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text not null,
  type       text not null default 'general'
             check (type in ('athlete', 'brand', 'media', 'general')),
  message    text not null,
  created_at timestamptz not null default now()
);

create index if not exists inquiries_created_at_idx on public.inquiries (created_at desc);
create index if not exists inquiries_type_idx       on public.inquiries (type);


-- ─── ROW LEVEL SECURITY ─────────────────────────────────────────────────────

alter table public.athletes  enable row level security;
alter table public.articles  enable row level security;
alter table public.inquiries enable row level security;

-- Public can read published athletes
create policy "public read published athletes"
  on public.athletes for select
  using (published = true);

-- Public can read published articles
create policy "public read published articles"
  on public.articles for select
  using (published = true);

-- Public can insert inquiries (contact form)
create policy "public insert inquiries"
  on public.inquiries for insert
  with check (true);

-- Service role (admin) has full access — no policy needed, bypasses RLS


-- ─── SEED: ATHLETES ─────────────────────────────────────────────────────────

insert into public.athletes
  (slug, name, position, sport, school, division, status, photo_url, featured, published)
values
  (
    'trey-alexander',
    'Trey Alexander',
    'Power Forward',
    'Basketball',
    null,
    null,
    'nil_client',
    '/assets/athletes/trey-alexander.jpg',
    true,
    true
  ),
  (
    'donta-king',
    'Donta King',
    'Power Forward',
    'Basketball',
    'Florida State University',
    'D-I',
    'nil_client',
    '/assets/athletes/donta-king.jpg',
    true,
    true
  ),
  (
    'andrew-mancell',
    'Andrew Mancell',
    'Power Forward',
    'Basketball',
    'Holmes Community College',
    'JUCO',
    'rising_star',
    '/assets/athletes/andrew-mancell.jpg',
    true,
    true
  ),
  (
    'tyler-husband',
    'Tyler Husband',
    'Power Forward',
    'Basketball',
    null,
    null,
    'pro_prospect',
    '/assets/athletes/tyler-husband.jpg',
    true,
    true
  ),
  (
    'koita-soumaela',
    'Koita Soumaela',
    'Power Forward',
    'Basketball',
    'Malawi National Team',
    'International',
    'pro_prospect',
    '/assets/athletes/koita-soumaela.jpg',
    true,
    true
  )
on conflict (slug) do nothing;
