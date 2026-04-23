-- ═══════════════════════════════════════════════════════════════════════════
-- HYCHE INTERNATIONAL MANAGEMENT SPORTS GROUP — DATABASE SCHEMA
-- Run this entire file in Supabase SQL Editor to initialize the database.
-- ═══════════════════════════════════════════════════════════════════════════


-- ─── EXTENSIONS ──────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ─── TRIGGER FUNCTION: auto-update updated_at ────────────────────────────────

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


-- ─── ATHLETES ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.athletes (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug               text        NOT NULL UNIQUE,
  name               text        NOT NULL,
  position           text,
  sport              text        NOT NULL,
  school             text,
  class_year         text,
  division           text,
  status             text        NOT NULL DEFAULT 'nil_client'
                                 CHECK (status IN ('nil_client', 'pro_prospect', 'rising_star', 'alumni')),
  photo_url          text,
  nil_value_display  text,
  featured           boolean     NOT NULL DEFAULT false,
  published          boolean     NOT NULL DEFAULT false,
  bio                text,
  instagram          text,
  twitter            text,
  tiktok             text,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER athletes_set_updated_at
  BEFORE UPDATE ON public.athletes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.athletes ENABLE ROW LEVEL SECURITY;

-- anon: SELECT published athletes only
CREATE POLICY "athletes_anon_select"
  ON public.athletes
  FOR SELECT
  TO anon
  USING (published = true);

-- authenticated: full access
CREATE POLICY "athletes_auth_select"
  ON public.athletes
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "athletes_auth_insert"
  ON public.athletes
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "athletes_auth_update"
  ON public.athletes
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "athletes_auth_delete"
  ON public.athletes
  FOR DELETE
  TO authenticated
  USING (true);


-- ─── ARTICLES ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.articles (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            text        NOT NULL UNIQUE,
  title           text        NOT NULL,
  excerpt         text,
  body            text,
  featured_image  text,
  author          text,
  published       boolean     NOT NULL DEFAULT false,
  published_at    timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER articles_set_updated_at
  BEFORE UPDATE ON public.articles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- anon: SELECT published articles only
CREATE POLICY "articles_anon_select"
  ON public.articles
  FOR SELECT
  TO anon
  USING (published = true);

-- authenticated: full access
CREATE POLICY "articles_auth_select"
  ON public.articles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "articles_auth_insert"
  ON public.articles
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "articles_auth_update"
  ON public.articles
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "articles_auth_delete"
  ON public.articles
  FOR DELETE
  TO authenticated
  USING (true);


-- ─── INQUIRIES ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.inquiries (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text        NOT NULL,
  email      text        NOT NULL,
  type       text        NOT NULL DEFAULT 'general'
             CHECK (type IN ('athlete', 'brand', 'media', 'general')),
  message    text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

-- anon: INSERT only
CREATE POLICY "inquiries_anon_insert"
  ON public.inquiries
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- authenticated: SELECT + INSERT
CREATE POLICY "inquiries_auth_select"
  ON public.inquiries
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "inquiries_auth_insert"
  ON public.inquiries
  FOR INSERT
  TO authenticated
  WITH CHECK (true);


-- ─── SEED DATA ───────────────────────────────────────────────────────────────

INSERT INTO public.athletes
  (slug, name, position, sport, school, class_year, division, status, photo_url, nil_value_display, featured, published, bio)
VALUES
  (
    'marcus-johnson',
    'Marcus Johnson',
    'Point Guard',
    'Basketball',
    'Jackson State University',
    '2025',
    'FCS / D1',
    'nil_client',
    NULL,
    '$25K',
    true,
    true,
    'Marcus is an explosive point guard out of Jackson State University with a proven ability to create off the dribble and lead a team. A Mississippi native with high-major transfer interest heading into his senior season.'
  ),
  (
    'darius-cole',
    'Darius Cole',
    'Wide Receiver',
    'Football',
    'Alcorn State University',
    '2026',
    'FCS / D1',
    'pro_prospect',
    NULL,
    '$18K',
    false,
    true,
    'Darius is a long, physical wideout with elite route-running and strong hands. He enters the 2025 season as one of the SWAC''s top receiving threats and a potential late-round draft prospect.'
  )
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.articles
  (slug, title, excerpt, body, author, published, published_at)
VALUES
  (
    'him-sports-group-launches',
    'Hyche International Management Sports Group Opens for Business',
    'Jackson, MS native and former Harlem Globetrotter Chris Hyche officially launches his boutique sports management agency.',
    'Jackson, Mississippi — Chris Hyche, a former Harlem Globetrotter and professional basketball player, has officially launched Hyche International Management Sports Group (HIM Sports Group), a boutique NIL and athlete representation agency based in Jackson, MS.

The agency will focus on NIL deal negotiation, contract representation, and brand architecture for collegiate and professional athletes across basketball, football, track & field, and other sports.

"I built my career the same way I now help my clients build theirs — through discipline, relationships, and a refusal to take shortcuts," said Hyche. "Athletes deserve representation from someone who has lived the life they''re working toward."

HIM Sports Group is currently accepting inquiries from athletes at all levels. Visit himsportsgroup.com/contact to apply for representation.',
    'HIM Sports Group Staff',
    true,
    now()
  )
ON CONFLICT (slug) DO NOTHING;
